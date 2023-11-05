import {
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

import { normalize, join } from 'node:path';
import { MainCompletionProvider } from '../autocomplete';
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
  ): Promise<CompletionItem[]> {
    this.createContext(position, document);
    const { isInclude, input } = createContext(position, document);

    if (!isInclude) {
      return [];
    }

    const allowedExtensions = this.isSnippetCall ? ['php'] : ['tpl', 'html'];

    const path = this.getPath(input);
    const childrenOfPath = await this.getChildrenOfPath(path, allowedExtensions);

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

  async getChildrenOfPath(path: string, allowedExtensions: string[]) {
    try {
      const filesTubles = await workspace.fs.readDirectory(
        Uri.file(path)
      );

      const files = filesTubles
        .map((fileTuble) => fileTuble[0])
        .filter((filename) => !filename.startsWith('.'));

      const fileInfoList: FileInfo[] = [];

      for (const file of files) {
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

  getPath(input: string): string {
    const elementsPath = getElementsPath(this.context.document);
    const pathArr = input.split('/') || [''];
    pathArr.pop();
    const string = pathArr.join('/');

    return join(elementsPath, string);
  }

  get isSnippetCall(): boolean {
    const { document, textAfter, textBefore } = this.context;

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
  const elementsPath = config.get<string>('elementsPath');

  const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
  let path = workspaceFolder?.uri.fsPath || '';
  if (elementsPath) {
    path += normalize(elementsPath);
  }

  return path;
}

export function createContext(
  position: Position,
  document: TextDocument,
): FileProviderContext {
  const textFullLine = document.lineAt(position).text;
  const textAfter = textFullLine.substring(position.character);

  let re = '';

  switch (document.languageId) {
    case 'modx':
      re = '`(@FILE )([^/.][\\w./?]*)?`';
      break;
    case 'fenom':
      re = '[\'"](@FILE |file:)([^/.][\\w./]*)?[\'"]';
      break;
  }

  const [ , include = '', input = '' ] = textFullLine.match(re) || [];
  const isInclude = !/\/{2,}/.test(input) && !!include && /^[\w./]*['"`]/.test(textAfter);
  const inputPosition = textFullLine.lastIndexOf(input);

  const inputRange = new Range(
    new Position(position.line, inputPosition),
    new Position(position.line, inputPosition + input.length)
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
