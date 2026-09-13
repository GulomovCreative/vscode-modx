// Разбор шаблона на области верхнего уровня.
//
// Провайдеры автодополнения определяют границы конструкций россыпью регулярных
// выражений — около сорока штук, каждое со своим представлением о том, где
// начинается тег и где кончается строка в кавычках. Форматированию нужен один
// источник истины: что здесь текст, что конструкция шаблона, а что комментарий,
// внутрь которого лезть нельзя.

export type TokenKind =
  | 'text'
  | 'modx-tag'
  | 'modx-comment'
  | 'fenom-tag'
  | 'fenom-comment'
  | 'fenom-ignore';

export interface Token {
  kind: TokenKind
  start: number
  end: number
  value: string
  /** Область оборвалась концом текста, а не своей закрывающей скобкой. */
  unterminated: boolean
}

interface Read {
  end: number
  terminated: boolean
}

export type TemplateLanguage = 'modx' | 'fenom';

const MODX_OPEN = '[[';
const MODX_CLOSE = ']]';
const MODX_COMMENT_OPEN = '[[-';

/**
 * Значение в обратных кавычках может содержать вложенный тег, поэтому кавычки
 * учитываются при поиске конца тега.
 */
function readModxTag(text: string, from: number): Read {
  let index = from + MODX_OPEN.length;
  let depth = 1;
  let inBacktick = false;

  while (index < text.length) {
    if (inBacktick) {
      // Удвоенная обратная кавычка внутри значения — экранирование, а не конец.
      if (text.startsWith('``', index)) {
        index += 2;
        continue;
      }

      if (text[index] === '`') {
        inBacktick = false;
      }

      index++;
      continue;
    }

    if (text[index] === '`') {
      inBacktick = true;
      index++;
      continue;
    }

    if (text.startsWith(MODX_OPEN, index)) {
      depth++;
      index += MODX_OPEN.length;
      continue;
    }

    if (text.startsWith(MODX_CLOSE, index)) {
      depth--;
      index += MODX_CLOSE.length;

      if (depth === 0) {
        return { end: index, terminated: true };
      }

      continue;
    }

    index++;
  }

  return { end: text.length, terminated: false };
}

/** Тег Fenom кончается на закрывающей скобке вне строки в кавычках. */
function readFenomTag(text: string, from: number): Read {
  let index = from + 1;
  let quote = '';

  while (index < text.length) {
    const char = text[index];

    if (quote) {
      if (char === '\\') {
        index += 2;
        continue;
      }

      if (char === quote) {
        quote = '';
      }

      index++;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      index++;
      continue;
    }

    if (char === '}') {
      return { end: index + 1, terminated: true };
    }

    index++;
  }

  return { end: text.length, terminated: false };
}

function readUntil(text: string, from: number, terminator: string): Read {
  const index = text.indexOf(terminator, from);

  return index === -1
    ? { end: text.length, terminated: false }
    : { end: index + terminator.length, terminated: true };
}

/**
 * Поток областей шаблона. Соседние куски обычного текста не склеиваются:
 * каждая конструкция отделена собственной областью, и смещения непрерывны.
 */
export function scan(text: string, language: TemplateLanguage): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let textStart = 0;

  const pushText = (until: number) => {
    if (until > textStart) {
      tokens.push({ kind: 'text', start: textStart, end: until, value: text.slice(textStart, until), unterminated: false });
    }
  };

  const pushToken = (kind: TokenKind, start: number, read: Read) => {
    pushText(start);
    tokens.push({
      kind,
      start,
      end: read.end,
      value: text.slice(start, read.end),
      unterminated: !read.terminated,
    });
    textStart = read.end;
  };

  while (index < text.length) {
    if (language === 'modx' && text.startsWith(MODX_OPEN, index)) {
      const isComment = text.startsWith(MODX_COMMENT_OPEN, index);
      const read = isComment ? readUntil(text, index, MODX_CLOSE) : readModxTag(text, index);

      pushToken(isComment ? 'modx-comment' : 'modx-tag', index, read);
      index = read.end;
      continue;
    }

    if (language === 'fenom' && text[index] === '{') {
      if (text.startsWith('{*', index)) {
        const read = readUntil(text, index, '*}');
        pushToken('fenom-comment', index, read);
        index = read.end;
        continue;
      }

      // {ignore} отключает разбор Fenom внутри себя — это документированный
      // способ вставить в шаблон CSS или JavaScript с фигурными скобками.
      const ignore = /^\{ignore\}/.exec(text.slice(index));
      if (ignore) {
        const read = readUntil(text, index, '{/ignore}');
        pushToken('fenom-ignore', index, read);
        index = read.end;
        continue;
      }

      const read = readFenomTag(text, index);
      pushToken('fenom-tag', index, read);
      index = read.end;
      continue;
    }

    index++;
  }

  pushText(text.length);

  return tokens;
}

/**
 * Область, внутри которой стоит курсор.
 *
 * Области идут подряд и не пересекаются, поэтому нужная ищется делением
 * пополам: провайдеры спрашивают это на каждое нажатие клавиши, а в большом
 * шаблоне областей тысячи.
 *
 * Курсор на самой открывающей скобке ещё снаружи, на закрывающей — уже
 * снаружи. Исключение одно: у незакрытой конструкции конец совпадает с концом
 * текста, и курсор там внутри — именно так выглядит тег, который набирают.
 */
export function tokenAt(tokens: Token[], offset: number): Token | undefined {
  let low = 0;
  let high = tokens.length - 1;

  while (low <= high) {
    const middle = (low + high) >> 1;
    const token = tokens[middle];

    if (offset <= token.start) {
      high = middle - 1;
      continue;
    }

    if (offset > token.end || (offset === token.end && !token.unterminated)) {
      low = middle + 1;
      continue;
    }

    return token;
  }

  return undefined;
}

/**
 * Смещения, которые нельзя трогать при форматировании: содержимое комментариев,
 * блоков {ignore} и многострочных конструкций шаблона.
 */
export function protectedRanges(tokens: Token[]): Array<{ start: number, end: number }> {
  return tokens
    .filter(token => token.kind !== 'text' && token.value.includes('\n'))
    .map(({ start, end }) => ({ start, end }));
}
