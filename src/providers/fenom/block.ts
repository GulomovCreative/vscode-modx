import { dirname, join } from 'node:path';
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  FileType,
  MarkdownString,
  Position,
  TextDocument,
  Uri,
  languages,
  workspace,
} from 'vscode';
import { t } from '@vscode/l10n';

import { FENOM_SELECTOR, getSortText } from '../../common';
import { FenomCompletionProvider } from './autocomplete';
import { getElementsPath } from '../file/autocomplete';

const BLOCK_NAME_PATTERN = /\{block\s+['"]([^'"]+)['"]/g;
const TEMPLATE_REF_PATTERN = /\{(?:extends|use)\s+['"]([^'"]+)['"]/g;
const MAX_TEMPLATE_DEPTH = 5;

class FenomBlockNameCompletion extends FenomCompletionProvider implements CompletionItemProvider {
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);

    if (!this.shouldProvide()) {
      return [];
    }

    const names = await this.collectBlockNames(document);

    return [...names].map((name, index) => this.createCompletionItem(name, index));
  }

  shouldProvide(): boolean {
    const body = this.getBody();
    const textBefore = body ? body.before : this.context.textBefore;

    return (
      /{(?:paste|block)\s+['"][^'"]*$/.test(textBefore) ||
      /\$\.blocks?\.\w*$/.test(this.context.textBefore)
    );
  }

  createCompletionItem(name: string, index: number): CompletionItem {
    const item = new CompletionItem(name, CompletionItemKind.Text);
    item.sortText = getSortText(index, name);
    item.detail = `{block '${name}'}`;
    item.documentation = new MarkdownString(t('fenom.block.name'));
    item.insertText = name;

    return item;
  }

  async collectBlockNames(document: TextDocument): Promise<Set<string>> {
    const names = new Set<string>();
    const visited = new Set<string>();

    this.extractBlockNames(document.getText(), names);
    await this.collectFromTemplateRefs(document.getText(), document, names, visited, 0);

    return names;
  }

  extractBlockNames(text: string, names: Set<string>): void {
    for (const match of text.matchAll(BLOCK_NAME_PATTERN)) {
      if (match[1]) {
        names.add(match[1]);
      }
    }
  }

  async collectFromTemplateRefs(
    text: string,
    document: TextDocument,
    names: Set<string>,
    visited: Set<string>,
    depth: number,
  ): Promise<void> {
    if (depth >= MAX_TEMPLATE_DEPTH) {
      return;
    }

    for (const match of text.matchAll(TEMPLATE_REF_PATTERN)) {
      const templateName = match[1];
      if (!templateName) {
        continue;
      }

      const uri = await this.resolveTemplateUri(templateName, document);
      if (!uri || visited.has(uri.fsPath)) {
        continue;
      }

      visited.add(uri.fsPath);

      try {
        const content = await workspace.fs.readFile(uri);
        const templateText = Buffer.from(content).toString('utf8');
        this.extractBlockNames(templateText, names);
        await this.collectFromTemplateRefs(templateText, document, names, visited, depth + 1);
      } catch {
        // Template may be missing or outside the workspace.
      }
    }
  }

  async resolveTemplateUri(name: string, document: TextDocument): Promise<Uri | undefined> {
    const cleaned = name.replace(/^(@FILE |file:)/, '');
    const candidates = [
      join(getElementsPath(document), cleaned),
      join(dirname(document.uri.fsPath), cleaned),
    ];

    for (const candidate of candidates) {
      const uri = Uri.file(candidate);

      try {
        const stat = await workspace.fs.stat(uri);
        if (stat.type === FileType.File) {
          return uri;
        }
      } catch {
        // Try the next candidate.
      }
    }

    return undefined;
  }
}

export default () => languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomBlockNameCompletion(),
  "'",
  '"',
  '.',
);
