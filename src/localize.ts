import { l10n } from 'vscode';
import bundle from '../l10n/bundle.l10n.json';

/**
 * Описания подсказок и текст диагностик по ключу.
 *
 * Ключи — это не английские строки, а идентификаторы: `FetchIt.description`,
 * `diagnostic.unclosedBlock`. Для vscode.l10n такой ключ и есть сообщение: он
 * подставляет перевод из bundle.l10n.<язык>.json, а если перевода нет —
 * возвращает аргумент как есть. Для английского интерфейса бандла нет вовсе,
 * потому что базовый bundle.l10n.json существует для переводчиков и в рантайме
 * не загружается, — и в подсказке оказывался сам ключ.
 *
 * Поэтому английский словарь вшивается в бандл на сборке и служит запасным
 * вариантом. Он же закрывает ключ, для которого перевод ещё не написан.
 *
 * Словарь именно вшивается, а не читается с диска: описания собираются при
 * импорте модуля (src/providers/fenom/tag.ts), так что к моменту первого
 * обращения асинхронное чтение могло бы не завершиться.
 */
const english: Record<string, string> = bundle;

/** Подстановка `{0}`, `{1}` — тем же порядком, что и у vscode.l10n. */
function fill(message: string, args: string[]): string {
  return message.replace(/\{(\d+)\}/g, (placeholder, index) => args[Number(index)] ?? placeholder);
}

export function t(key: string, ...args: string[]): string {
  const translated = l10n.t(key, ...args);

  // Вернулся сам ключ — перевода нет, язык интерфейса английский либо строка
  // в bundle.l10n.<язык>.json отсутствует.
  if (translated !== key) {
    return translated;
  }

  const message = english[key];

  return message === undefined ? key : fill(message, args);
}
