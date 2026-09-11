import {
  CancellationToken,
  TextDocument,
  Position,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  FileType,
  FileStat,
  Uri,
  workspace,
  Range,
  languages,
} from 'vscode';

import { join } from 'node:path';
import { MainCompletionProvider, type Context } from '../autocomplete';
import { SELECTORS, RETRIGGER_COMMAND } from '../../common';

export interface FileInfo {
  file: string;
  isFile: boolean;
  documentExtension?: string;
}

export interface FileProviderContext {
  input: string
  isInclude: boolean
  inputRange: Range
}

class FileCompletionProvider extends MainCompletionProvider implements CompletionItemProvider {
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token?: CancellationToken,
  ): Promise<CompletionItem[]> {
    // Провайдер асинхронный, а экземпляр один на всё расширение: всё, что нужно
    // после await, берётся из локального контекста, а не из поля this.context.
    const context = this.createContext(position, document);
    const { isInclude, input } = createContext(position, document);

    if (!isInclude) {
      return [];
    }

    const allowedExtensions = this.isSnippetCall(context) ? ['php'] : ['tpl', 'html'];

    const path = this.getPath(input, document);
    const childrenOfPath = await this.getChildrenOfPath(path, allowedExtensions, token);

    if (token?.isCancellationRequested) {
      return [];
    }

    return childrenOfPath.map(this.createCompletionItem);
  }

  createCompletionItem(fileInfo: FileInfo): CompletionItem {
    const item = new CompletionItem(fileInfo.file, fileInfo.isFile ? CompletionItemKind.File : CompletionItemKind.Folder);
    item.sortText = `${fileInfo.isFile ? 'b' : 'a'}_${fileInfo.file}`;
    item.insertText = fileInfo.isFile ? fileInfo.file : `${fileInfo.file}/`;

    if (!fileInfo.isFile) {
      item.command = RETRIGGER_COMMAND;
    }

    return item;
  }

  async getChildrenOfPath(path: string, allowedExtensions: string[], token?: CancellationToken) {
    try {
      const filesTubles = await workspace.fs.readDirectory(
        Uri.file(path)
      );

      const files = filesTubles
        .map((fileTuble) => fileTuble[0])
        .filter((filename) => !filename.startsWith('.'));

      const fileInfoList: FileInfo[] = [];

      for (const file of files) {
        if (token?.isCancellationRequested) {
          return fileInfoList;
        }

        const fileStat = await workspace.fs.stat(Uri.file(join(path, file)));
        const documentExtension = this.getDocumentExtension(file, fileStat);
        if (documentExtension && !allowedExtensions.includes(documentExtension)) {
          continue;
        }

        fileInfoList.push({
          file,
          isFile: fileStat.type === FileType.File,
          documentExtension,
        });
      }

      return fileInfoList;
    } catch {
      return [];
    }
  }

  getDocumentExtension(file: string, fileStat: FileStat) {
    if (fileStat.type !== FileType.File) {
      return undefined;
    }

    const fragments = file.split('.');
    return fragments[fragments.length - 1];
  }

  getPath(input: string, document: TextDocument): string {
    const elementsPath = getElementsPath(document);
    const pathArr = input.replace(/^[/\\]+/, '').split('/');
    pathArr.pop();
    const relative = pathArr.join('/');

    return relative ? join(elementsPath, relative) : elementsPath;
  }

  isSnippetCall(context: Context): boolean {
    const { document, textAfter, textBefore } = context;

    if (
      document.languageId === 'fenom' &&
      (
        /\$_modx->runSnippet\(['"]@FILE [^'"]*$/.test(textBefore) || /^[^'"]*['"]\s*\|\s*snippet/.test(textAfter)
      )
    ) {
      return true;
    }

    return false;
  }
}

export function getElementsPath(document: TextDocument): string {
  const config = workspace.getConfiguration('vscode-modx');
  const elementsPath = config.get<string>('elementsPath')?.trim() ?? '';
  const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
  const root = workspaceFolder?.uri.fsPath || '';

  // Empty, "/", or "." means the workspace / project root.
  if (!elementsPath || elementsPath === '/' || elementsPath === '.') {
    return root;
  }

  // elementsPath is configured with a leading slash (default: /core/elements/).
  // Use join with a relative segment so an absolute second argument does not
  // discard the workspace root on POSIX.
  return join(root, elementsPath.replace(/^[/\\]+/, ''));
}

export function createContext(
  position: Position,
  document: TextDocument,
): FileProviderContext {
  const textFullLine = document.lineAt(position).text;

  let re: RegExp | undefined;

  switch (document.languageId) {
    case 'modx':
      // Allow empty path and leading "/" so users can browse from the elements/project root.
      re = /`(@FILE )([\w./?]*)?`/g;
      break;
    case 'fenom':
      re = /['"](@FILE |file:)([\w./]*)?['"]/g;
      break;
  }

  // В одной строке может быть несколько биндингов, например
  // &tpl=`@FILE a.tpl` &tplWrapper=`@FILE b.tpl`. Берётся тот, внутри пути
  // которого стоит курсор, а не первый в строке.
  let include = '';
  let input = '';
  let inputPosition = -1;

  for (const match of re ? textFullLine.matchAll(re) : []) {
    const matchInclude = match[1] ?? '';
    const matchInput = match[2] ?? '';
    // Совпадение начинается с кавычки или обратной кавычки, за ней идёт
    // префикс биндинга, и только потом сам путь.
    const start = (match.index ?? 0) + 1 + matchInclude.length;

    if (position.character >= start && position.character <= start + matchInput.length) {
      include = matchInclude;
      input = matchInput;
      inputPosition = start;
      break;
    }
  }

  const isInclude = !!include && !/\/{2,}/.test(input);
  const start = Math.max(inputPosition, 0);

  const inputRange = new Range(
    new Position(position.line, start),
    new Position(position.line, start + input.length)
  );

  return {
    input,
    inputRange,
    isInclude,
  };
}

export default languages.registerCompletionItemProvider(
  SELECTORS,
  new FileCompletionProvider(),
  ':',
  '/'
);
