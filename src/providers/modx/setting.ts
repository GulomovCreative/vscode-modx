import { TextDocument, Position, CompletionItemProvider, CompletionItem, SnippetString, CompletionItemKind, MarkdownString, Range, languages, env } from 'vscode';

import { MODX_SELECTOR, getSortText } from '../../common';

import { ModxCompletionProvider } from './autocomplete';
import { systemSettings as settings, DOCUMENTATION_URL } from '../../schemas/settings';
import { t } from '../../localize';

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
    const isInsideTag = this.isInsideTag;
    const [ tokens = '' ] = this.context.textBefore.match(/!?\+{2}$/) || [];
    const { wordRange } = this.context;

    return settings.map((setting, index) => {
      const item = new CompletionItem(setting, CompletionItemKind.Variable);
      item.sortText = getSortText(index, setting);

      item.documentation = new MarkdownString(t(`setting.${setting}`));
      item.documentation.appendMarkdown(`\n\n`);
      item.documentation.appendMarkdown(`[${t('reference')}](${DOCUMENTATION_URL.replace('{lang}', env.language || 'en' ) + setting})`);

      item.detail = `[[${tokens + setting}]]`;

      if (!isInsideTag) {
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

export default () => languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxSettingCompletion(),
  '+'
);
