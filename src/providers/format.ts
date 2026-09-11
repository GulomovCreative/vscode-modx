import {
  DocumentFormattingEditProvider,
  DocumentRangeFormattingEditProvider,
  FormattingOptions,
  Position,
  Range,
  TextDocument,
  TextEdit,
  languages,
} from 'vscode';

import { SELECTORS } from '../common';
import { format, type TemplateLanguage } from '../formatter';
import { getDocumentText } from '../cache';

/**
 * Правки по строкам, а не одна на весь документ: так редактор сохраняет
 * положение курсора и сворачивание, а в истории отмены остаётся только то,
 * что действительно изменилось.
 */
function lineEdits(document: TextDocument, formatted: string, within?: Range): TextEdit[] {
  const before = getDocumentText(document).split('\n');
  const after = formatted.split('\n');
  const edits: TextEdit[] = [];

  const first = within ? within.start.line : 0;
  const last = within ? within.end.line : before.length - 1;

  for (let line = first; line <= last && line < before.length; line++) {
    if (before[line] === after[line]) {
      continue;
    }

    edits.push(TextEdit.replace(
      new Range(new Position(line, 0), new Position(line, before[line].length)),
      after[line],
    ));
  }

  return edits;
}

function formatDocument(document: TextDocument, options: FormattingOptions, within?: Range): TextEdit[] {
  const language = document.languageId as TemplateLanguage;

  const formatted = format(getDocumentText(document), language, {
    tabSize: options.tabSize,
    insertSpaces: options.insertSpaces,
  });

  return lineEdits(document, formatted, within);
}

class TemplateFormattingProvider implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {
  provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions): TextEdit[] {
    return formatDocument(document, options);
  }

  provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
  ): TextEdit[] {
    // Отступ строки зависит от того, что было выше, поэтому документ считается
    // целиком, а правки отдаются только для выделенных строк.
    return formatDocument(document, options, range);
  }
}

// Оба провайдера регистрируются намеренно. Объявив modx и fenom участниками
// HTML, расширение отдаёт их HTML-серверу, и тот вешает на них своё
// форматирование диапазона. Собственные провайдеры имеют приоритет и забирают
// у него и «Format Document», и «Format Selection».
const provider = new TemplateFormattingProvider();

export const formatDocumentDisposable =
  languages.registerDocumentFormattingEditProvider(SELECTORS, provider);

export const formatRangeDisposable =
  languages.registerDocumentRangeFormattingEditProvider(SELECTORS, provider);
