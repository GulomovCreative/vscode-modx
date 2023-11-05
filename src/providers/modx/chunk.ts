import { TextDocument, Position, CompletionItemProvider, CompletionItem, CompletionItemKind, MarkdownString, languages, Range, env } from 'vscode';
import { t } from '@vscode/l10n';

import { MODX_SELECTOR } from '../../common';
import { ModxCompletionProvider } from './autocomplete';

class ModxChunkCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);
    if (this.isInBraces || !/\$$/.test(this.context.textBefore)) {
      return;
    }

    const { wordRange } = this.context;
    const word = document.getText(wordRange);

    if (!word) {
      return [];
    }

    const [ tokens = '' ] = this.context.textBefore.match(/!?\$$/) || [];

    const item = new CompletionItem(`$${word}`, CompletionItemKind.Property);
    item.detail = `[[${tokens + word}]]`;
    item.documentation = this.getDocumentation();
    item.insertText = `[[${tokens + word}]]`;
    item.filterText = `$${tokens + word}`;
    item.range = new Range(
      wordRange.start.translate({ characterDelta: tokens.length * -1 }),
      wordRange.end,
    );

    return [item];
  }

  getDocumentation(): MarkdownString | string {
    const documentation = new MarkdownString(t('chunk'));
    documentation.appendMarkdown(`\n\n`);
    documentation.appendMarkdown(`[${t('reference')}](https://docs.modx.com/current/${env.language || 'en'}/building-sites/elements/chunks)`);

    return documentation;
  }
}

export default languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxChunkCompletion(),
  '$'
);
