import { CompletionItem, CompletionItemKind, CompletionItemProvider, MarkdownString, Position, SnippetString, TextDocument, languages } from 'vscode';
import { t } from '@vscode/l10n';
import { FenomCompletionProvider } from './autocomplete';
import { getSortText } from '../../common';

import { systemSettings } from '../../schemas/settings';
import { fenomModifiers, Modifier } from '../../schemas/modifiers';
import { FENOM_SELECTOR } from '../../common';

class FenomModifierProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    if (!this.shouldProvide()) {
      return [];
    }

    const { textBefore, textAfter } = this.context;

    const [ , charBefore, charAfter ] = textBefore.match(/(.)\|(.)?$/s) || [];
    const withoutSpaces = charBefore !== ' ' || charAfter === ' ';
    const withArgs = !/^\s*:/.test(textAfter);

    return this.getCompletionItems(withoutSpaces, withArgs);
  }

  getCompletionItems(
    withoutSpaces: boolean,
    withArgs: boolean,
  ): CompletionItem[] {
    return fenomModifiers.reduce((result, mod) => {
      if (Array.isArray(mod.name)) {
        mod.name.forEach(name => {
          result.push(this.createCompletionItem(name, mod, result.length, withoutSpaces, withArgs));
        });
      } else {
        result.push(this.createCompletionItem(mod.name, mod, result.length, withoutSpaces, withArgs));
      }

      return result;
    }, [] as CompletionItem[]);
  }

  createCompletionItem(
    name: string,
    mod: Modifier,
    index: number,
    withoutSpaces: boolean,
    withArgs: boolean
  ): CompletionItem {
    const item = new CompletionItem(name, CompletionItemKind.Method);
    item.sortText = getSortText(index, name);

    item.documentation = new MarkdownString(t(`fenom.modifier.${Array.isArray(mod.name) ? mod.name[0] : mod.name}`));
    if (mod.link) {
      item.documentation.appendMarkdown(`\n\n`);
      item.documentation.appendMarkdown(`[${t('reference')}](${mod.link})`);
    }

    let body = ' ' + name;

    if (mod.detail) {
      const detail = mod.detail.replace(/{name}/, name);
      item.detail = detail;

      if (withArgs) {
        const [ , args = '' ] = detail.match(/{\$\w*\s*\|\s*\w*\s*:?(.*)?}/) || [];

        if (args) {
          body += args.split(':').reduce((result, arg, index) => {
            const [ , name, hasDefault ] = arg.trim().match(/(\$\w*)(\s*(=)\s*(.*))?/) || [];

            if (!hasDefault) {
              result += ' : ${' + (index + 1) + ':\\' + name + '}';
            }

            return result;
          }, '');
        }
      }
    }

    let insertText = body + '$0';
    if (withoutSpaces) {
      insertText = insertText.replace(/\s/g, '');
    }

    item.insertText = new SnippetString(insertText);

    return item;
  }

  shouldProvide(): boolean {
    if (
      this.isInMustacheBlock
      && /(?<!\|)\|(?!\|)\s?$/.test(this.context.textBefore.replace(/\s/g, ''))
    ) {
      return true;
    }

    return false;
  }
}

class FenomConfigModifierProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    if (!this.shouldProvide()) {
      return [];
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const { textAfter, wordRange } = this.context;
    const [ , quote = '', , modifier = '' ] = textAfter.match(/^(['"])(\s*\|\s*(config|option))?/) || [];

    return systemSettings.map(setting => {
      const item = new CompletionItem(setting, CompletionItemKind.Property);
      item.documentation = new MarkdownString(t(`setting.${setting}`));
      item.detail = `{'${setting}' | ${modifier || 'option'}}`;
      item.sortText = `z${setting}`;

      if (!modifier) {
        item.insertText = new SnippetString(`${setting}${quote} | \${1|option,config|}`);
        item.range = wordRange.with({ end: wordRange.end.translate({ characterDelta: 1 }) });
      }

      return item;
    });
  }

  shouldProvide(): boolean {
    const { textFullLine, textAfter, textBefore } = this.context;

    if (
      this.isInMustacheBlock &&
      (
        (
          /^['"](\s*\|\s*(config|option))?[^\])]?}/.test(textAfter)
          && !/:\s*'$/.test(textBefore)
          && /['"][^@:]*$/.test(textBefore)
        )
        || /=>\s*['"]\w*$/.test(textBefore)
      )
    ) {
      return true;
    }

    if (/{['"][a-zA-Z0-9_\-.]*['"]}/.test(textFullLine)) {
      return true;
    }

    return false;
  }
}

export const fenomModifierCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomModifierProvider(),
  '|'
);

export const fenomConfigModifierCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomConfigModifierProvider(),
  '\''
);

export default {
  fenomModifierCompletionDisposable,
  fenomConfigModifierCompletionDisposable,
};
