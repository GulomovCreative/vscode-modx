import { CompletionItem, CompletionItemKind, CompletionItemProvider, MarkdownString, Position, TextDocument, languages } from 'vscode';
import { t } from '@vscode/l10n';
import { FenomCompletionProvider } from './autocomplete';
import { FENOM_SELECTOR } from '../../common';

export const args = [
  'index',
  'first',
  'last',
];

class FenomArgumentCompletionProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position) {
    this.createContext(position, document);
    if (!this.isInMustacheBlock) {
      return [];
    }

    if (!/\w+@$/.test(this.context.textBefore)) {
      return [];
    }

    const tags = this.getParentTags();
    if (!tags.some(tag => tag.name === 'foreach')) {
      return [];
    }

    return args.map(this.createCompletionItem);
  }

  createCompletionItem(name: string): CompletionItem {
    const item = new CompletionItem(name, CompletionItemKind.Keyword);
    item.documentation = new MarkdownString(t(`var.foreach.${name}`));

    return item;
  }
}

export default languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomArgumentCompletionProvider(),
  '@'
);
