import { TextDocument, Position, CompletionItemProvider, CompletionItem, CompletionItemKind, MarkdownString, languages, SnippetString, Range } from 'vscode';
import { t } from '@vscode/l10n';

import { MODX_SELECTOR, getSortText } from '../../common';
import { ModxCompletionProvider } from './autocomplete';
import fields from '../../schemas/resource';
import { DOCUMENTATION_URL, fieldPrefixes, globalArrays } from '../../schemas/fastfield';

class ModxFastFieldCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);

    const { textBefore } = this.context;

    if (/(\[{2})?!?#$/.test(textBefore)) {
      return this.getRootCompletionItems();
    }

    if (/(\[{2})?!?#\d+\.$/.test(textBefore)) {
      return this.getFieldCompletionItems();
    }

    return;
  }

  getRootCompletionItems(): CompletionItem[] {
    const isInsideTag = this.isInsideTag;
    const [ tokens = '' ] = this.context.textBefore.match(/!?#$/) || [];
    const { wordRange } = this.context;

    const items = globalArrays.map((name, index) => {
      const item = this.createCompletionItem(name, index, isInsideTag, tokens, wordRange);
      item.insertText = isInsideTag
        ? new SnippetString(`${name}.\${1:key}`)
        : new SnippetString(`[[${tokens}${name}.\${1:key}]]`);
      item.detail = `[[${tokens}${name}.key]]`;
      item.documentation = this.createDocumentation(t(`fastfield.${name}`));

      return item;
    });

    const resourceSnippet = this.createCompletionItem('${id}.${field}', globalArrays.length, isInsideTag, tokens, wordRange);
    resourceSnippet.kind = CompletionItemKind.Snippet;
    resourceSnippet.insertText = isInsideTag
      ? new SnippetString('${1:id}.${2:pagetitle}')
      : new SnippetString(`[[${tokens}\${1:id}.\${2:pagetitle}]]`);
    resourceSnippet.detail = `[[${tokens}15.pagetitle]]`;
    resourceSnippet.documentation = this.createDocumentation(t('fastfield.resource'));
    resourceSnippet.filterText = tokens + 'id';

    items.push(resourceSnippet);

    return items;
  }

  getFieldCompletionItems(): CompletionItem[] {
    const isInsideTag = this.isInsideTag;
    const [ tokens = '' ] = this.context.textBefore.match(/!?#\d+\.$/) || [];
    const prefix = tokens.slice(0, -1);
    const { wordRange } = this.context;

    const fieldItems = fields.map((field, index) => {
      const item = this.createCompletionItem(field, index, isInsideTag, tokens, wordRange, prefix);
      item.documentation = this.createDocumentation(t(`resource.${field}`));
      item.detail = `[[${prefix}.${field}]]`;

      if (!isInsideTag) {
        item.insertText = new SnippetString(`[[${prefix}.${field}]]`);
      }

      return item;
    });

    const prefixItems = fieldPrefixes.map((name, index) => {
      const item = this.createCompletionItem(name, fields.length + index, isInsideTag, tokens, wordRange, prefix);
      item.kind = CompletionItemKind.Snippet;
      item.documentation = this.createDocumentation(t(`fastfield.${name.slice(0, -1)}`));
      item.detail = `[[${prefix}.${name}key]]`;

      const insertName = `${name}\${1:name}`;
      item.insertText = isInsideTag
        ? new SnippetString(insertName)
        : new SnippetString(`[[${prefix}.${insertName}]]`);

      return item;
    });

    return [...fieldItems, ...prefixItems];
  }

  createCompletionItem(
    name: string,
    index: number,
    isInsideTag: boolean,
    tokens: string,
    wordRange: Range,
    prefix = '',
  ): CompletionItem {
    const item = new CompletionItem(name, CompletionItemKind.Variable);
    item.sortText = getSortText(index, name);

    if (!isInsideTag) {
      item.filterText = (prefix ? `${prefix}.` : tokens) + name;
      item.range = new Range(
        wordRange.start.translate({ characterDelta: tokens.length * -1 }),
        wordRange.end,
      );
    }

    return item;
  }

  createDocumentation(description: string): MarkdownString {
    const documentation = new MarkdownString(description);
    documentation.appendMarkdown(`\n\n`);
    documentation.appendMarkdown(`[${t('reference')}](${DOCUMENTATION_URL})`);

    return documentation;
  }
}

export default () => languages.registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxFastFieldCompletion(),
  '#',
  '.',
);
