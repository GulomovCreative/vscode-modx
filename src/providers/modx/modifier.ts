import { TextDocument, Position, CompletionItemProvider, CompletionItem, CompletionItemKind, MarkdownString, SnippetString, languages, env } from 'vscode';
import { t } from '@vscode/l10n';

import { ModxCompletionProvider } from './autocomplete';
import { modxModifiers as modifiers, type Modifier } from '../../schemas/modifiers';
import { MODX_SELECTOR, RETRIGGER_COMMAND } from '../../common';

const { registerCompletionItemProvider } = languages;

class ModxModifierCompletion extends ModxCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);
    if (!this.isInBracesBlock) {
      return;
    }

    const beforeBody = this.getBeforeBody();
    const backtickCount = (beforeBody.match(/`/g) || []).length;

    if (!/:[^`:\s]*$/g.test(beforeBody) || backtickCount % 2 !== 0) {
      return;
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const insertNameOnly = /^=`/g.test(this.context.textAfter);

    return modifiers.reduce((items, item) => {
      if (Array.isArray(item.name)) {
        item.name.forEach((name) => {
          items.push(this.createCompletionItem(name, item, insertNameOnly));
        });
      } else {
        items.push(this.createCompletionItem(item.name, item, insertNameOnly));
      }

      return items;
    }, [] as CompletionItem[]);
  }

  createCompletionItem(
    name: string,
    mod: Modifier,
    insertNameOnly: boolean,
  ): CompletionItem {
    const item = new CompletionItem(name, CompletionItemKind.Method);
    item.documentation = new MarkdownString(t(`modx.modifier.${Array.isArray(mod.name) ? mod.name[0] : mod.name}`));
    item.documentation.supportHtml = true;

    if (mod.example) {
      item.documentation.appendMarkdown('\n\n');
      item.documentation.appendCodeblock(mod.example, 'modx');
    }

    if (mod.link) {
      item.documentation.appendMarkdown(`\n\n`);
      item.documentation.appendMarkdown(`[${t('reference')}](${env.language === 'ru' ? mod.link : 'https://docs.modx.com/current/en/building-sites/tag-syntax/output-filters'})`);
    }

    const arg = mod.placeholder ? ('=`' + (mod.placeholder === true ? 'input' : mod.placeholder) + '`') : '';
    item.detail = `[[+placeholder:${name + arg}]]`;
    item.insertText = this.getInsertText(name, mod, insertNameOnly);

    if (mod?.body?.endsWith(':')) {
      item.command = RETRIGGER_COMMAND;
    }

    return item;
  }

  getInsertText(
    name: string,
    mod: Modifier,
    insertNameOnly: boolean
  ): SnippetString |string {
    if (insertNameOnly) {
      return name;
    }

    if (mod.body) {
      return new SnippetString(mod.body.replace('{name}', name));
    }

    if (mod.placeholder) {
      return new SnippetString(`${name}=\`\${1:${mod.placeholder === true ? 'input' : mod.placeholder}}\``);
    }

    return name;
  }
}

export default registerCompletionItemProvider(
  MODX_SELECTOR,
  new ModxModifierCompletion(),
  ':',
);
