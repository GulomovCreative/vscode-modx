// Замена двух функций lodash. Пакет весил 219 КБ — 57% бандла — ради них двоих.

/**
 * Число внутри полуинтервала [start, end).
 * Повторяет поведение lodash: границы переставляются местами, если start > end.
 */
export function inRange(value: number, start: number, end?: number): boolean {
  if (typeof end === 'undefined') {
    end = start;
    start = 0;
  }

  return value >= Math.min(start, end) && value < Math.max(start, end);
}

// Выражение разбора пути из lodash: имя сегмента, индекс в скобках либо ключ
// в кавычках внутри скобок с учётом экранирования.
const PROPERTY_NAME = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const ESCAPED_CHAR = /\\(\\)?/g;

/**
 * Строка пути к свойству в массив сегментов: `a.b[0]['c']` → `['a','b','0','c']`.
 */
export function toPath(value: string): string[] {
  const result: string[] = [];

  if (value.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }

  for (const match of value.matchAll(PROPERTY_NAME)) {
    const [ whole, index, , quoted ] = match;

    if (typeof quoted !== 'undefined') {
      result.push(quoted.replace(ESCAPED_CHAR, '$1'));
    } else {
      result.push(index ?? whole);
    }
  }

  return result;
}
