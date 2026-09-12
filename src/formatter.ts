import { scan, type TemplateLanguage, type Token } from './scanner';

export type { TemplateLanguage };

// Форматирование шаблонов MODX и Fenom.
//
// Делается ровно одно: выравниваются отступы строк. Ничего не переносится, не
// схлопывается и не переписывается внутри конструкций — это сознательное
// ограничение. HTML-форматтер, который сейчас достаётся этим языкам как
// участникам HTML, пытается делать больше и на шаблонах ошибается: непарная
// разметка в ветках {if}/{else} уезжает лесенкой, а тег в позиции атрибута он
// правит внутри самой конструкции.

export interface FormatOptions {
  tabSize: number
  insertSpaces: boolean
}

// Элементы без закрывающего тега.
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// Содержимое этих элементов форматируется по своим правилам, поэтому строки
// внутри остаются как есть.
const VERBATIM_ELEMENTS = new Set(['pre', 'textarea', 'script', 'style']);

// Парные теги Fenom.
const FENOM_BLOCK_TAGS = new Set([
  'if', 'foreach', 'for', 'while', 'switch', 'block', 'filter',
  'macro', 'autoescape', 'ignore', 'strip', 'escape',
]);

// Середины ветвления: встают на уровень открывающего тега, как {if} и {else}.
const FENOM_BRANCH_TAGS = new Set(['else', 'elseif', 'foreachelse', 'forelse']);

// Середины перебора: вкладываются внутрь {switch}, как case в PHP.
const FENOM_CASE_TAGS = new Set(['case', 'default']);

const FENOM_MIDDLE_TAGS = new Set([...FENOM_BRANCH_TAGS, ...FENOM_CASE_TAGS]);

interface LineShape {
  /** На сколько уровней сдвинуть саму строку относительно текущего. */
  dedent: number
  /** На сколько изменится уровень для следующих строк. */
  delta: number
  /** Открывает, продолжает или закрывает блок шаблона. */
  boundary?: 'open' | 'middle' | 'case' | 'close'
}

/** Теги HTML в строке, без содержимого конструкций шаблона. */
function htmlDelta(line: string): { leading: number, delta: number } {
  let leading = 0;
  let delta = 0;
  let seenContent = false;

  for (const match of line.matchAll(/<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>'"])*)>/g)) {
    const [ whole, rawName, attributes = '' ] = match;
    const name = rawName.toLowerCase();

    if (VOID_ELEMENTS.has(name) || attributes.trimEnd().endsWith('/')) {
      seenContent = true;
      continue;
    }

    if (whole.startsWith('</')) {
      if (!seenContent && delta === 0) {
        leading++;
      } else {
        delta--;
      }
    } else {
      delta++;
      seenContent = true;
    }
  }

  return { leading, delta };
}

/**
 * Теги Fenom в строке.
 *
 * Ветвление шаблона и вложенность HTML независимы: в {if}/{else} каждая ветвь
 * держит свою разметку, и она не обязана быть парной внутри ветви. Поэтому
 * граница ветви не считается дельтой, а сообщается отдельно — уровень на ней
 * восстанавливается по тому, каким он был на открывающем теге.
 */
function fenomDelta(tokens: Token[]): { leading: number, delta: number, boundary?: 'open' | 'middle' | 'case' | 'close' } {
  const leading = 0;
  let delta = 0;
  let boundary: 'open' | 'middle' | 'case' | 'close' | undefined;
  let seenContent = false;

  for (const token of tokens) {
    if (token.kind !== 'fenom-tag') {
      continue;
    }

    const name = /^\{(\/?)([a-z]+)/.exec(token.value);
    if (!name) {
      continue;
    }

    const [ , slash, tag ] = name;

    if (slash) {
      if (!FENOM_BLOCK_TAGS.has(tag)) {
        continue;
      }

      if (!seenContent && !boundary) {
        boundary = 'close';
      } else {
        delta--;
      }

      continue;
    }

    if (FENOM_MIDDLE_TAGS.has(tag)) {
      if (!seenContent && !boundary) {
        boundary = FENOM_CASE_TAGS.has(tag) ? 'case' : 'middle';
      }

      continue;
    }

    if (FENOM_BLOCK_TAGS.has(tag)) {
      if (!seenContent && !boundary) {
        boundary = 'open';
      } else {
        delta++;
      }

      seenContent = true;
    }
  }

  return { leading, delta, boundary };
}

/** Незакрытые скобки MODX: многострочный вызов сниппета. */
function modxDelta(line: string, tokens: Token[]): { leading: number, delta: number, boundary?: undefined } {
  const covered = tokens.some(token => token.kind !== 'text');
  if (covered) {
    return { leading: 0, delta: 0 };
  }

  const opens = (line.match(/\[\[(?!-)/g) || []).length;
  const closes = (line.match(/\]\]/g) || []).length;
  const delta = opens - closes;
  const leading = delta < 0 && /^\s*\]\]/.test(line) ? 1 : 0;

  return { leading, delta: leading ? delta + 1 : delta };
}

function shapeOf(line: string, language: TemplateLanguage): LineShape {
  const trimmed = line.trim();

  if (!trimmed) {
    return { dedent: 0, delta: 0 };
  }

  const tokens = scan(line, language);
  const html = htmlDelta(stripTemplate(line, tokens));
  const template = language === 'fenom' ? fenomDelta(tokens) : modxDelta(line, tokens);

  return {
    dedent: html.leading + template.leading,
    delta: html.delta + template.delta,
    boundary: template.boundary,
  };
}

/** Конструкции шаблона заменяются пробелами, чтобы HTML в них не считался. */
function stripTemplate(line: string, tokens: Token[]): string {
  let result = '';

  for (const token of tokens) {
    result += token.kind === 'text' ? token.value : ' '.repeat(token.value.length);
  }

  return result || line;
}

/** Разметка строк: что заморожено, а что продолжает многострочную конструкцию. */
function lineRoles(text: string, language: TemplateLanguage) {
  const lines = text.split('\n');
  const offsets: number[] = [];
  let offset = 0;

  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }

  const lineAt = (position: number) => {
    let found = 0;
    for (let index = 0; index < offsets.length; index++) {
      if (offsets[index] <= position) {
        found = index;
      }
    }

    return found;
  };

  // Комментарии и {ignore} сохраняются посимвольно: внутри них может лежать
  // чужой код, и переставлять в нём отступы нельзя.
  const frozen = new Set<number>();
  // Продолжение многострочного тега: отступ на уровень глубже открывающей
  // строки, закрывающая строка возвращается на её уровень.
  const continuation = new Map<number, { opener: number, closing: boolean }>();

  for (const token of scan(text, language)) {
    if (token.kind === 'text' || !token.value.includes('\n')) {
      continue;
    }

    const first = lineAt(token.start);
    const last = lineAt(token.end - 1);

    for (let index = first + 1; index <= last; index++) {
      if (token.kind === 'modx-comment' || token.kind === 'fenom-comment' || token.kind === 'fenom-ignore') {
        frozen.add(index);
      } else {
        continuation.set(index, { opener: first, closing: index === last });
      }
    }
  }

  for (const element of VERBATIM_ELEMENTS) {
    const pattern = new RegExp(`<${element}\\b[^>]*>([\\s\\S]*?)</${element}>`, 'gi');
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const first = lineAt(start);
      const last = lineAt(start + match[0].length - 1);

      for (let index = first + 1; index < last; index++) {
        frozen.add(index);
      }
    }
  }

  return { lines, frozen, continuation };
}

export function format(text: string, language: TemplateLanguage, options: FormatOptions): string {
  const unit = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
  const { lines, frozen, continuation } = lineRoles(text, language);
  const result: string[] = [];
  const indents: number[] = [];

  // Уровень, на котором открылся каждый незакрытый блок шаблона. Он же
  // восстанавливается на {else} и на закрывающем теге: ветвление шаблона и
  // вложенность HTML независимы, и разметка внутри ветви может быть непарной.
  const blocks: number[] = [];
  let level = 0;

  lines.forEach((line, index) => {
    if (frozen.has(index)) {
      result.push(line);
      indents.push(indents[index - 1] ?? level);

      return;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      result.push('');
      indents.push(level);

      return;
    }

    const carried = continuation.get(index);

    if (carried) {
      const base = indents[carried.opener] ?? 0;
      const indent = carried.closing ? base : base + 1;

      result.push(unit.repeat(indent) + trimmed);
      indents.push(indent);

      return;
    }

    const { dedent, delta, boundary } = shapeOf(line, language);

    let indent: number;

    if (boundary === 'middle' || boundary === 'close') {
      indent = blocks.length ? blocks[blocks.length - 1] : Math.max(level - 1, 0);
    } else if (boundary === 'case') {
      indent = blocks.length ? blocks[blocks.length - 1] + 1 : Math.max(level - 1, 0);
    } else {
      indent = Math.max(level - dedent, 0);
    }

    result.push(unit.repeat(indent) + trimmed);
    indents.push(indent);

    if (boundary === 'open') {
      blocks.push(indent);
      level = indent + 1 + delta;
    } else if (boundary === 'middle' || boundary === 'case') {
      level = indent + 1 + delta;
    } else if (boundary === 'close') {
      blocks.pop();
      level = indent + delta;
    } else {
      level = indent + delta;
    }

    level = Math.max(level, 0);
  });

  return result.join('\n');
}
