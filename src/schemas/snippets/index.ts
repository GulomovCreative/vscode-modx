import { CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';
import { t } from '@vscode/l10n';
import { getSortText } from '../../common';

import pdoToolsSnippets from './pdoTools/';
import FormItSnippets from './FormIt/';
import miniShop2Snippets from './miniShop2/';
import FetchIt from './FetchIt';

export interface SnippetProp {
  name: string
  description?: string
  default?: SnippetPropType | string | number
  example?: string
  insertText?: string
  type?: 'string' | 'number'
}

export interface SnippetPropType {
  type: 'inline' | 'code' | 'text'
  value: string | number
}

export interface SnippetData {
  name: string
  description: string
  link?: string
  props: SnippetProp[]
}

export const snippets = [
  FetchIt,
  ...pdoToolsSnippets,
  ...FormItSnippets,
  ...miniShop2Snippets,
];

export function createPropCompletionItem(
  prop: SnippetProp,
  index: number,
): CompletionItem {
  const item = new CompletionItem(prop.name, CompletionItemKind.Property);
  item.documentation = new MarkdownString(prop.description);
  item.documentation.supportHtml = true;
  item.sortText = getSortText(index, prop.name);

  if (prop.example) {
    item.documentation.appendMarkdown('\n\n');
    item.documentation.appendMarkdown(t('example') + ':');
    item.documentation.appendCodeblock(prop.example);
  }

  return item;
}
