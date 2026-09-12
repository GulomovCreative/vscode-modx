import { Range, Position, TextDocument } from 'vscode';
import { getDocumentText, getTokens } from '../cache';
import { tokenAt } from '../scanner';

export interface Context {
  textFullLine: string
  textBefore: string
  textAfter: string
  wordRange: Range
  position: Position
  document: TextDocument
}

export class MainCompletionProvider {
  // Провайдер регистрируется одним экземпляром на всё расширение, поэтому поле
  // разделяется между запросами. Для синхронного provideCompletionItems это
  // безопасно — между разбором контекста и возвратом ничего не выполняется.
  // Асинхронный провайдер обязан работать с контекстом, который вернул
  // createContext(), и не читать это поле после первого await.
  public context: Context;

  getBefore(): string {
    const { position, document } = this.context;
    const positionOffset = document.offsetAt(position);

    return getDocumentText(document).slice(0, positionOffset);
  }

  /**
   * Курсор внутри конструкции шаблона — `[[…]]` или `{…}`.
   *
   * Разбор ведёт сканер, а не регулярное выражение по строке: конструкция
   * может занимать несколько строк, содержать `}` в кавычках или `]]` в
   * значении в обратных кавычках, а в одной строке их может быть несколько.
   */
  get isInsideTag(): boolean {
    const { position, document } = this.context;
    const kind = tokenAt(getTokens(document), document.offsetAt(position))?.kind;

    return kind === 'modx-tag' || kind === 'fenom-tag';
  }

  getAfter(): string {
    const { position, document } = this.context;
    const positionOffset = document.offsetAt(position);

    return getDocumentText(document).slice(positionOffset);
  }

  createContext(
    position: Position,
    document: TextDocument,
  ): Context {
    const textFullLine = document.lineAt(position.line).text;
    const wordRange = document.getWordRangeAtPosition(position) || new Range(position, position);
    const textBefore = textFullLine.substring(0, wordRange?.start.character || position.character);
    const textAfter = textFullLine.substring(wordRange?.end.character || position.character);

    this.context = {
      textFullLine,
      wordRange,
      textBefore,
      textAfter,
      position,
      document,
    };

    return this.context;
  }
}
