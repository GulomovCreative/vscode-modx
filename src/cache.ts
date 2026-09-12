import { TextDocument } from 'vscode';

import { scan, type TemplateLanguage, type Token } from './scanner';

/**
 * Кеш разбора документа, действующий до его следующей правки.
 *
 * Провайдеры автодополнения вызываются на каждое нажатие клавиши, и каждый из
 * них перечитывает документ целиком: getText() для текста до и после курсора,
 * плюс проход регулярным выражением по всему тексту для поиска блоков. На один
 * ввод это повторяется столько раз, сколько провайдеров зарегистрировано для
 * языка — семь для MODX и девять для Fenom.
 *
 * Ключ — сам объект документа: редактор держит один экземпляр на открытый файл,
 * поэтому WeakMap освобождает запись вместе с закрытием файла. Версия документа
 * меняется ровно при правке, то есть тогда, когда кеш и нужно сбросить.
 */
function createDocumentCache<T>(compute: (document: TextDocument) => T) {
  const entries = new WeakMap<TextDocument, { version: number, value: T }>();

  return (document: TextDocument): T => {
    const cached = entries.get(document);

    if (cached && cached.version === document.version) {
      return cached.value;
    }

    const value = compute(document);
    entries.set(document, { version: document.version, value });

    return value;
  };
}

export const getDocumentText = createDocumentCache((document) => document.getText());

/**
 * Разбор документа на конструкции шаблона.
 *
 * Один разбор на правку документа обслуживает все провайдеры языка: и проверку
 * «курсор внутри конструкции», и перечисление тегов Fenom.
 */
export const getTokens = createDocumentCache((document): Token[] =>
  scan(getDocumentText(document), document.languageId as TemplateLanguage));

export interface FenomBlock {
  start: number
  end: number
  input: string
}

export const getFenomBlocks = createDocumentCache((document): FenomBlock[] =>
  getTokens(document)
    .filter(token => token.kind === 'fenom-tag')
    .map(({ start, end, value }) => ({ start, end, input: value })));
