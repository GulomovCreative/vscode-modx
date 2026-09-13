// Разметка HTML: то, что нужно и форматированию, и диагностике.

/** Элементы без закрывающего тега. */
export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Тег целиком, в том числе на нескольких строках: кавычки и `[^>'"]` внутри
 * пропускают перевод строки. Флаг `g` безопасно делить между вызовами —
 * `matchAll` работает с собственной копией и `lastIndex` оригинала не трогает.
 */
export const HTML_TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>'"])*)>/g;

const HTML_COMMENT = /<!--[\s\S]*?(?:-->|$)/g;

/**
 * Комментарии HTML гасятся пробелами.
 *
 * Иначе `<!-- <div> -->` считается настоящим тегом: в закомментированной
 * разметке половина пар обычно и остаётся за пределами комментария.
 */
export function stripComments(text: string): string {
  return text.replace(HTML_COMMENT, (match) => ' '.repeat(match.length));
}

/** Тег закрывает сам себя: `<br>` или `<img … />`. */
export function isSelfContained(name: string, attributes: string): boolean {
  return VOID_ELEMENTS.has(name.toLowerCase()) || attributes.trimEnd().endsWith('/');
}
