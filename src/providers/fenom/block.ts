import { dirname, join } from 'node:path';
import {
  CancellationToken,
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
import { type Context } from '../autocomplete';
import { getElementsPath } from '../file/autocomplete';
import { getDocumentText } from '../../cache';

const BLOCK_NAME_PATTERN = /\{block\s+['"]([^'"]+)['"]/g;
const TEMPLATE_REF_PATTERN = /\{(?:extends|use)\s+['"]([^'"]+)['"]/g;
const MAX_TEMPLATE_DEPTH = 5;

// Обход по {extends} и {use} читает файлы с диска, а провайдер вызывается на
// каждое нажатие клавиши внутри кавычек. Разобранные имена блоков чужого
// шаблона кешируются по времени его изменения, чтобы набор имени не перечитывал
// дерево шаблонов заново на каждый символ.
const templateCache = new Map<string, { mtime: number, names: string[] }>();

class FenomBlockNameCompletion extends FenomCompletionProvider implements CompletionItemProvider {
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token?: CancellationToken,
  ) {
    // Разбор контекста целиком до первого await: экземпляр провайдера один на
    // всё расширение, и поле this.context переживёт ожидание не своим.
    const context = this.createContext(position, document);

    if (!this.shouldProvide(context)) {
      return [];
    }

    const names = await this.collectBlockNames(document, token);

    if (token?.isCancellationRequested) {
      return [];
    }

    return [...names].map((name, index) => this.createCompletionItem(name, index));
  }

  shouldProvide(context: Context): boolean {
    const body = this.getBody();
    const textBefore = body ? body.before : context.textBefore;

    return (
      /{(?:paste|block)\s+['"][^'"]*$/.test(textBefore) ||
      /\$\.blocks?\.\w*$/.test(context.textBefore)
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

  async collectBlockNames(document: TextDocument, token?: CancellationToken): Promise<Set<string>> {
    const names = new Set<string>();
    const visited = new Set<string>();
    const text = getDocumentText(document);

    this.extractBlockNames(text, names);
    await this.collectFromTemplateRefs(text, document, names, visited, 0, token);

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
    token?: CancellationToken,
  ): Promise<void> {
    if (depth >= MAX_TEMPLATE_DEPTH || token?.isCancellationRequested) {
      return;
    }

    for (const match of text.matchAll(TEMPLATE_REF_PATTERN)) {
      const templateName = match[1];
      if (!templateName) {
        continue;
      }

      if (token?.isCancellationRequested) {
        return;
      }

      const resolved = await this.resolveTemplateUri(templateName, document);
      if (!resolved || visited.has(resolved.uri.fsPath)) {
        continue;
      }

      const { uri, mtime } = resolved;
      visited.add(uri.fsPath);

      const cached = templateCache.get(uri.fsPath);
      if (cached && cached.mtime === mtime) {
        cached.names.forEach(name => names.add(name));
        continue;
      }

      try {
        const content = await workspace.fs.readFile(uri);
        const templateText = Buffer.from(content).toString('utf8');
        const own = new Set<string>();
        this.extractBlockNames(templateText, own);
        templateCache.set(uri.fsPath, { mtime, names: [...own] });
        own.forEach(name => names.add(name));
        await this.collectFromTemplateRefs(templateText, document, names, visited, depth + 1, token);
      } catch {
        // Template may be missing or outside the workspace.
      }
    }
  }

  async resolveTemplateUri(
    name: string,
    document: TextDocument,
  ): Promise<{ uri: Uri, mtime: number } | undefined> {
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
          return { uri, mtime: stat.mtime };
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
