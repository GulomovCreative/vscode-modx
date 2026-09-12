import { TextDocument } from 'vscode';

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

export interface FenomBlock {
  start: number
  end: number
  input: string
}

export const getFenomBlocks = createDocumentCache((document): FenomBlock[] =>
  [...getDocumentText(document).matchAll(/{[^'"}]*(("[^"]*"|'[^']*')[^'"}]*)*}/gm)].map(match => {
    const [ input = '' ] = match;
    const index = match.index || 0;

    return {
      input,
      start: index,
      end: index + input.length,
    };
  }),
);
