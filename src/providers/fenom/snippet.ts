import { CompletionItem, CompletionItemKind, CompletionItemProvider, MarkdownString, Position, SnippetString, TextDocument, languages } from 'vscode';
import { FenomCompletionProvider } from './autocomplete';
import { snippets } from '../../schemas/snippets/';
import { createPropCompletionItem } from '../../schemas/snippets/';
import { FENOM_SELECTOR } from '../../common';

class FenomSnippetModifierProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position) {
    this.createContext(position, document);

    if (!this.shouldProvide) {
      return [];
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const withModifier = !/^['"]\s*\|\s*snippet/.test(this.context.textAfter);
    const quote = this.context.textAfter.match(/^['"]/);

    const { wordRange, textBefore } = this.context;
    const token = /!$/.test(textBefore);

    return snippets.map(snippet => {
      const completionItem = new CompletionItem(snippet.name, CompletionItemKind.Function);

      if (withModifier) {
        completionItem.insertText = `${snippet.name}${quote} | snippet`;
        completionItem.range = wordRange.with({ end: wordRange.end.translate({ characterDelta: 1 }) });
      }

      completionItem.detail = `{'${token ? '!' : ''}${snippet.name}' | snippet}`;
      completionItem.documentation = new MarkdownString(snippet.description);

      return completionItem;
    });
  }

  get shouldProvide(): boolean {
    const { textFullLine, textAfter, textBefore } = this.context;
    const before = this.getBefore();

    if (
      this.isInMustacheBlock &&
      (
        (
          /^['"](\s*\|\s*snippet)?[^\])]?/.test(textAfter)
          && !/:\s*['"]$/.test(textBefore)
          && /['"][^@:]*$/.test(textBefore)
          && !/[,[]\s*['"]\w*$/.test(before)
        )
        || /=>\s*['"]\w*$/.test(textBefore)
      )
    ) {
      return true;
    }

    if (/{['"]!?[a-zA-Z0-9_\-.]*['"]}/.test(textFullLine)) {
      return true;
    }

    return false;
  }
}

class FenomSnippetMethodProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    if (!this.shouldProvide) {
      return [];
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    return snippets.map(snippet => {
      const completionItem = new CompletionItem(snippet.name, CompletionItemKind.Function);

      return completionItem;
    });
  }

  get shouldProvide(): boolean {
    if (
      this.isInMustacheBlock
      && /\$_modx->runSnippet\(['"]!?$/.test(this.context.textBefore)
    ) {
      return true;
    }

    return false;
  }
}

class FenomSnippetPropProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position) {
    this.createContext(position, document);

    const snippet = this.getSnippet();

    if (!this.shouldProvide() || !snippet) {
      return [];
    }

    const snippetData = snippets.find(snip => snip.name === snippet.name);
    if (!snippetData) {
      return [];
    }

    const { wordRange, textAfter, textBefore } = this.context;
    const [ quote ] = textBefore.match(/['"]$/) || [];
    const needComma = !/^['"]\s*\]/.test(textAfter);

    return snippetData.props
      .filter(prop => !snippet.enteredProps.includes(prop.name))
      .map((prop, index) => {
        const completionItem = createPropCompletionItem(prop, index);

        if (!/^['"]\s*=>\s*['"]?.*['"]?/.test(textAfter)) {
          const value = (prop.type === 'number' || typeof prop.default === 'number') ? '$1' : (quote + '$1' + quote);

          completionItem.insertText = new SnippetString(`${prop.name}${quote} => ${value}${needComma ? ',' : ''}`);
          completionItem.range = wordRange.with({ end: wordRange.end.translate({ characterDelta: 1 }) });
        }

        return completionItem;
      });
  }

  shouldProvide(): boolean {
    if (
      this.isInMustacheBlock
      && (
        /(?<=[[,])\s*['"]$/.test(this.context.textBefore) || /^\s*['"]$/.test(this.context.textBefore)
      )
    ) {
      return true;
    }

    return false;
  }
}

const fenomSnippetModifierCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomSnippetModifierProvider(),
  '\'',
  '"',
  '!'
);

const fenomSnippetMethodCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomSnippetMethodProvider(),
  '\'',
  '"',
  '!'
);

const fenomSnippetPropCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomSnippetPropProvider(),
  '\'',
  '"',
);

export {
  fenomSnippetModifierCompletionDisposable,
  fenomSnippetMethodCompletionDisposable,
  fenomSnippetPropCompletionDisposable,
};
