// Что Fenom считает парным тегом.
//
// Знание нужно и форматированию, и диагностике, и подсказкам, а раньше лежало
// в каждом из них своим списком. Модуль намеренно не зависит от vscode: его
// читают и те части, которые собираются и проверяются отдельно от редактора.

/** Теги, которые закрываются через `{/тег}`. */
export const BLOCK_TAGS = new Set([
  'if', 'foreach', 'for', 'while', 'switch', 'block', 'filter',
  'macro', 'autoescape', 'ignore', 'strip', 'escape',
]);

/**
 * Теги, которые бывают и блоком, и одиночной инструкцией.
 *
 * `Compiler::setOpen` закрывает тег на месте, если видит присваивание:
 * `{var $x = 1}` — инструкция, `{var $x}…{/var}` — блок.
 */
export const DUAL_TAGS = new Set(['var', 'set', 'add']);

/** Середины ветвления: уровень у них как у открывающего тега. */
export const BRANCH_TAGS = new Set(['else', 'elseif', 'foreachelse', 'forelse']);

/** Середины перебора: вкладываются внутрь `{switch}`, как case в PHP. */
export const CASE_TAGS = new Set(['case', 'default']);

export const MIDDLE_TAGS = new Set([...BRANCH_TAGS, ...CASE_TAGS]);

/** Какой блок продолжает эта середина ветвления. */
export const BRANCH_OWNER: Record<string, string[]> = {
  else: ['if', 'foreach', 'for'],
  elseif: ['if'],
  foreachelse: ['foreach'],
  forelse: ['for'],
  case: ['switch'],
  default: ['switch'],
};

/** Имя тега и то, закрывающий ли он: `{/foreach}` → `{ closing: true, name: 'foreach' }`. */
export function parseTagName(value: string): { closing: boolean, name: string, rest: string } | undefined {
  // После имени обязателен пробел или закрывающая скобка. Без этого правила
  // `{filter: blur(2px)}` из инлайнового CSS читался бы как блочный тег Fenom
  // `{filter}`, и каждый такой блок стиля объявлялся бы незакрытым.
  const match = /^\{(\/?)([a-z]+)(?=[\s}])([\s\S]*)\}$/.exec(value);

  if (!match) {
    return undefined;
  }

  return { closing: Boolean(match[1]), name: match[2], rest: match[3] };
}

/** Открывает ли тег блок: для `{var}`, `{set}` и `{add}` это зависит от присваивания. */
export function opensBlock(name: string, rest: string): boolean {
  if (DUAL_TAGS.has(name)) {
    return !rest.includes('=');
  }

  return BLOCK_TAGS.has(name);
}
