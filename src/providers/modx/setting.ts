import { TextDocument, Position, CompletionItemProvider, CompletionItem, SnippetString, CompletionItemKind, MarkdownString, Range, languages, env } from 'vscode';
import { t } from '@vscode/l10n';

import { MODX_SELECTOR, getSortText } from '../../common';

import { ModxCompletionProvider } from './autocomplete';
import { systemSettings as settings, DOCUMENTATION_URL } from '../../schemas/settings';

class ModxSettingCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);

    if (!/(\[{2})?!?(?<!\+)\+{2}$/.test(this.context.textBefore)) {
      return;
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const isInBracesBlock = this.isInBracesBlock;
    const [ tokens = '' ] = this.context.textBefore.match(/!?\+{2}$/) || [];
    const { wordRange } = this.context;

    return settings.map((setting, index) => {
      const item = new CompletionItem(setting, CompletionItemKind.Variable);
      item.sortText = getSortText(index, setting);

      item.documentation = new MarkdownString(t(`setting.${setting}`));
      item.documentation.appendMarkdown(`\n\n`);
      item.documentation.appendMarkdown(`[${t('reference')}](${DOCUMENTATION_URL.replace('{lang}', env.language || 'en' ) + setting})`);
      item.documentation.isTrusted = true;

      item.detail = `[[${tokens + setting}]]`;

      if (!isInBracesBlock) {
        item.insertText = new SnippetString(`[[${tokens + setting}]]`);
        item.filterText = tokens + setting;
        item.range = new Range(
          wordRange.start.translate({ characterDelta: tokens.length * -1 }),
          wordRange.end,
        );
      }

      return item;
    });
  }
}

export default languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxSettingCompletion(),
  '+'
);
