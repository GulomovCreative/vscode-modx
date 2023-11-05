import { MainCompletionProvider } from '../autocomplete';

export interface ParsedSnippetData {
  name: string
  enteredProps: string[]
}

export class ModxCompletionProvider extends MainCompletionProvider {
  get isInBraces(): boolean {
    const { position, document } = this.context;

    return Boolean(document.getWordRangeAtPosition(position, /\[{2}([^}])+\]{2}/));
  }

  get isInBracesBlock(): boolean {
    if (this.isInBraces) {
      return true;
    }

    const before = this.getBefore();
    const openningSquareBracketsCount = (before.match(/(\[{2})/g) || []).length;
    const closingSquareBracketsCount = (before.match(/(\]{2})/g) || []).length;

    return openningSquareBracketsCount > closingSquareBracketsCount;
  }

  getSnippet(): ParsedSnippetData {
    const body = this.getBody();
    const [ , name ] = body.match(/(?<=\[{2})(?:!)?(.*?)(?=\?|@|:)/) || [];

    const cleanedProps = body.replace(/(?<==`).*?(?=`\s*[&\]])/g, '');
    const enteredProps = cleanedProps.match(/(?<=&).*?(?==`)/gm) || [];

    return {
      name,
      enteredProps,
    };
  }

  getBody(): string {
    return this.getBeforeBody() + this.getAfterBody();
  }

  getBeforeBody(): string {
    const textBefore = this.getBefore();
    let body = '';

    let diff = 1;
    const matches = [...textBefore.matchAll(/(\[{2}(?!-))|(\]{2})/g)].reverse() || [];

    for (const match of matches) {
      if (match[0] === '[[') {
        diff--;
      } else if (match[0] === ']]') {
        diff++;
      }

      if (diff === 0 && match.index) {
        body = textBefore.substring(match.index);
        break;
      }
    }

    return body;
  }

  getAfterBody(): string {
    const textAfter = this.getAfter();
    let body = '';

    let diff = -1;
    const matches = [...textAfter.matchAll(/(\[{2}(?!-))|(\]{2})/g)] || [];

    for (const match of matches) {
      if (match[0] === '[[') {
        diff--;
      } else if (match[0] === ']]') {
        diff++;
      }

      if (diff === 0 && match.index) {
        body = textAfter.substring(0, match.index + 2);
        break;
      }
    }

    return body;
  }
}
