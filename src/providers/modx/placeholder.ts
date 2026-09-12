import { TextDocument, Position, CompletionItemProvider, CompletionItem, CompletionItemKind, CompletionContext, MarkdownString, languages, SnippetString, Range, env, CancellationToken, l10n } from 'vscode';

import { MODX_SELECTOR, getSortText } from '../../common';
import { ModxCompletionProvider } from './autocomplete';
import fields, { DOCUMENTATION_URL } from '../../schemas/resource';

class ModxPlaceholderCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    this.createContext(position, document);

    if (!/(\[{2})?!?(?<!\+)[+*]$/.test(this.context.textBefore)) {
      return;
    }

    return this.getCompletionItems(context);
  }

  getCompletionItems(context: CompletionContext) {
    const isInsideTag = this.isInsideTag;
    const [ tokens = '' ] = this.context.textBefore.match(/!?[+*]$/) || [];
    const { wordRange } = this.context;

    const items = [...fields];

    if (context.triggerCharacter === '+' || /\+$/.test(this.context.textBefore)) {
      items.push('modx.user.id', 'modx.user.username');
    }

    return items.map((field, index) => this.createCompletionItem(field, index, isInsideTag, tokens, wordRange));
  }

  createCompletionItem(
    name: string,
    index: number,
    isInsideTag: boolean,
    tokens: string,
    wordRange: Range,
  ): CompletionItem {
    const item = new CompletionItem(name, CompletionItemKind.Variable);
    item.sortText = getSortText(index, name);

    if (name.startsWith('modx.user.')) {
      item.documentation = new MarkdownString(l10n.t(name.replace(/^modx\./, '')));
    } else {
      item.documentation = new MarkdownString(l10n.t(`resource.${name}`));
      item.documentation.appendMarkdown(`\n\n`);
      item.documentation.appendMarkdown(`[${l10n.t('reference')}](${DOCUMENTATION_URL.replace('{lang}', env.language || 'en' )})`);
    }

    item.detail = `[[${tokens + name}]]`;

    if (!isInsideTag) {
      item.insertText = new SnippetString(`[[${tokens + name}]]`);
      item.filterText = tokens + name;
      item.range = new Range(
        wordRange.start.translate({ characterDelta: tokens.length * -1 }),
        wordRange.end,
      );
    }

    return item;
  }
}

export default () => languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxPlaceholderCompletion(),
  '*',
  '+',
);
