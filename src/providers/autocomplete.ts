import { Range, Position, TextDocument } from 'vscode';

export interface Context {
  textFullLine: string
  textBefore: string
  textAfter: string
  wordRange: Range
  position: Position
  document: TextDocument
}

export class MainCompletionProvider {
  public context: Context;

  getBefore(): string {
    const { position, document } = this.context;
    const positionOffset = document.offsetAt(position);

    return document.getText().slice(0, positionOffset);
  }

  getAfter(): string {
    const { position, document } = this.context;
    const positionOffset = document.offsetAt(position);

    return document.getText().slice(positionOffset);
  }

  createContext(
    position: Position,
    document: TextDocument,
  ) {
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
  }
}
