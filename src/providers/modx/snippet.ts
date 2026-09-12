import { TextDocument, Position, CompletionItemProvider, CompletionItem, CompletionItemKind, MarkdownString, SnippetString, languages, l10n } from 'vscode';

import { ModxCompletionProvider } from './autocomplete';
import { snippets, createPropCompletionItem, type SnippetProp } from '../../schemas/snippets/';
import { MODX_SELECTOR } from '../../common';

class ModxSnippetCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);
    if (!this.isInsideTag) {
      return;
    }

    if (!/\[{2}!?$/.test(this.context.textBefore)) {
      return;
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const { textAfter } = this.context;

    const nameOnly = /^\?/.test(textAfter);

    return snippets.map((snippet) => {
      const item = new CompletionItem(snippet.name, CompletionItemKind.Function);
      item.documentation = new MarkdownString(snippet.description);

      if (snippet.link) {
        item.documentation.appendMarkdown(`\n\n`);
        item.documentation.appendMarkdown(`[${l10n.t('reference')}](${snippet.link})`);
      }

      item.insertText = new SnippetString(
        nameOnly
          ? snippet.name
          : /^\]{2}$/.test(textAfter)
            ? `${snippet.name}?\n\t$0\n`
            : snippet.name
        );

      return item;
    });
  }
}

class ModxSnippetPropCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);
    if (!this.isInsideTag) {
      return;
    }

    if (!/(?<=[\s`?]\s*)&$/.test(this.context.textBefore)) {
      return;
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const snippetData = this.getSnippet();
    const snippet = snippets.find(snippet => snippet.name === snippetData.name);

    if (!snippet) {
      return [];
    }

    const nameOnly = /^=`/.test(this.context.textAfter);

    const props = snippet.props
      .filter(prop => !snippetData.enteredProps.includes(prop.name))
      .map((prop, index) => this.createCompletionItem(prop, index, nameOnly));

    return props;
  }

  createCompletionItem(
    prop: SnippetProp,
    index: number,
    nameOnly: boolean,
  ): CompletionItem {
    const item = createPropCompletionItem(prop, index);

    let value = '$1';
    if (['string', 'number'].includes(typeof(prop.default))) {
      value = `\${1:${prop.default}}`;
    } else if (typeof prop.default === 'object' && prop.default?.type !== 'text') {
      value = `\${1:${prop.default?.value}}`;
    }

    item.insertText = new SnippetString(
      nameOnly
        ? prop.name
        : prop.insertText || `${prop.name}=\`${value}\`$0`);

    return item;
  }
}

const registerModxSnippetCompletion = () => languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxSnippetCompletion(),
  '[',
  '!'
);

const registerModxSnippetPropCompletion = () => languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxSnippetPropCompletion(),
  '&'
);

export {
  registerModxSnippetCompletion,
  registerModxSnippetPropCompletion,
};
