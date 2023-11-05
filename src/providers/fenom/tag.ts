import { TextDocument, Position, CompletionItemProvider, CompletionItem, MarkdownString, SnippetString, CompletionItemTag, Range, CompletionItemKind, languages } from 'vscode';
import { t } from '@vscode/l10n';

import { FenomCompletionProvider } from './autocomplete';
import { FENOM_SELECTOR } from '../../common';

export interface Tag {
  name: string
  body?: string
  args?: string[]
  description?: string
  parentTags?: string[]
  paired?: boolean
  deprecated?: boolean
  detail?: string
  kind?: CompletionItemKind
}

export const tags: Tag[] = [
  {
    name: 'set',
    body: '{set $${1:name} = ${2:value}}',
  },
  {
    name: 'add',
    body: '{add $${1:name} = ${2:value}}',
  },
  {
    name: 'var',
    body: '{var $${1:name} = ${2:value}}',
    deprecated: true,
  },
  {
    name: 'if',
    body: '{if ${1:condition}}\n\t$0\n{/if}',
    paired: true,
  },
  {
    name: 'else',
    body: '{else}\n\t',
    parentTags: ['if'],
  },
  {
    name: 'elseif',
    body: '{elseif ${1:condition}}\n\t',
    parentTags: ['if'],
  },
  {
    name: 'foreach',
    body: '{foreach $${1:list} as $${2:value}}\n\t$0\n{/foreach}',
    args: ['index', 'first', 'last'],
    paired: true,
  },
  {
    name: 'foreachelse',
    parentTags: ['foreach'],
  },
  {
    name: 'break',
    parentTags: ['foreach'],
  },
  {
    name: 'continue',
    parentTags: ['continue'],
  },
  {
    name: 'switch',
    body: '{switch ${1:condition}}\n\t{case ${2:value}}\n\t\t$0\n{/switch}',
    paired: true,
  },
  {
    name: 'case',
    body: '{case ${1:value}}\n\t',
    parentTags: ['switch'],
  },
  {
    name: 'cycle',
    body: '{cycle [${1:value}]}',
    args: ['index'],
  },
  {
    name: 'include',
    body: "{include '${1:file}'}",
  },
  {
    name: 'insert',
    body: "{insert '${1:file}'}",
  },
  {
    name: 'extends',
    body: "{extends '${1:file}'}",
  },
  {
    name: 'block',
    body: "{block '${1:name}'}\n\t$0\n{/block}",
    paired: true,
  },
  {
    name: 'use',
    body: "{use '${1:file}'}",
  },
  {
    name: 'parent',
    body: '{parent}\n',
    parentTags: ['block'],
  },
  {
    name: 'paste',
    body: "{paste '${1:name}'}",
  },
  {
    name: 'filter',
    body: '{filter | ${1:modifier}}\n\t$0\n{/filter}',
    paired: true,
  },
  {
    name: 'ignore',
    body: '{ignore}\n\t$0\n{/ignore}',
    paired: true,
  },
  {
    name: 'macro',
    body: '{macro ${1:name}(${2:arguments})}\n\t$0\n{/macro}',
    paired: true,
  },
  {
    name: 'import',
    body: "{import '${1:file}'}",
  },
  {
    name: 'autoescape',
    body: '{autoescape true}\n\t$0\n{/autoescape}',
    paired: true,
  },
  {
    name: 'raw',
    body: '{raw ${1:expression}}',
  },
  {
    name: 'unset',
    body: '{unset $${1:variable}}',
  },
].map(data => ({ ...data, description: t(`fenom.tag.${data.name}`) }));

export const snippets: Tag[] = [
  {
    name: 'set',
    body: '{set $${1:name}}\n\t$0\n{/set}',
    description: t('fenom.snippet.set block'),
    kind: CompletionItemKind.Snippet,
  },
  {
    name: 'ifelse',
    body: '{if ${1:condition}}\n\t$2\n{else}\n\t$3\n{/if}',
    description: t('fenom.snippet.ifelse'),
    kind: CompletionItemKind.Snippet,
  },
];

export const options = [
  {
    name: 'raw',
    description: t('fenom.option.raw'),
  },
  {
    name: 'ignore',
    description: t('fenom.option.ignore'),
  },
];

class FenomTagCompletion extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ) {
    this.createContext(position, document);

    if (!this.shouldProvide()) {
      return [];
    }

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const { textBefore, textAfter, wordRange } = this.context;
    const closestTag = this.getClosestTag();
    const name = closestTag?.name;

    const hasExtendsBefore = this.hasExtendsBefore();

    return [...tags, ...snippets].reduce((filtered, tag) => {
      if (
        !name && tag.parentTags ||
        name && tag.parentTags && !tag.parentTags.includes(name)
      ) {
        return filtered;
      }

      if (tag.name === 'block' && !hasExtendsBefore) {
        return filtered;
      }

      if (tag.name === 'extends' && hasExtendsBefore) {
        return filtered;
      }

      const item = new CompletionItem(tag.name, tag.kind || CompletionItemKind.Property);
      item.documentation = new MarkdownString(tag.description);

      const insertText = /{$/.test(textBefore) && !/^}/.test(textAfter) ? tag.name : (tag.body || `{${tag.name}}`);
      item.insertText = new SnippetString(insertText);

      if (/{$/.test(textBefore) && /^}/.test(textAfter)) {
        item.filterText = `{${tag.name}}`;
        item.range = new Range(
          wordRange.start.translate({ characterDelta: -1 }),
          wordRange.end.translate({ characterDelta: 1 }),
        );
      }

      if (tag.deprecated) {
        item.tags = [CompletionItemTag.Deprecated];
      }

      item.detail = item.insertText.value.replace(/\${\d:(.*?)}/g, '$1').replace(/\t/g, '  ').replace(/\$\d/g, '|');

      filtered.push(item);

      return filtered;
    }, [] as CompletionItem[]);
  }

  shouldProvide(): boolean {
    if (/(?<=^\s*{?)\w*$/.test(this.context.textBefore)) {
      return true;
    }

    return false;
  }
}

class FenomTagCloseCompletion extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    const closestTag = this.getClosestTag();
    if (!closestTag) {
      return [];
    }

    const tag = tags.find(item => item.name === closestTag?.name);
    if (!this.shouldProvide() || !tag) {
      return [];
    }

    const completionitem = this.createCompletionItem(tag);

    return [completionitem];
  }

  createCompletionItem(tag: Tag): CompletionItem {
    const { position } = this.context;

    const label = '/' + tag.name;
    const item = new CompletionItem(label, CompletionItemKind.Module);
    item.insertText = tag.name;

    if (!this.isInMustache) {
      item.insertText = `{${label}}`;

      item.range = new Range(
        position.with({ character: (this.context.wordRange?.start || position).character - 1 }),
        position,
      );
    }

    return item;
  }

  shouldProvide(): boolean {
    const { textBefore } = this.context;

    const quotes = textBefore.match(/['"]/g) || [];
    if (/{?\/[a-z]*$/.test(textBefore) && quotes.length % 2 === 0) {
      return true;
    }

    return false;
  }
}

class FenomTagArgumentCompletion extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    const quotes = this.context.textBefore.match(/['"]/g) || [];
    if (!this.isInMustache || quotes.length % 2 !== 0) {
      return [];
    }

    const [ , tagName ] = this.context.textBefore.match(/{(\w+)/) || [];
    if (!tagName) {
      return [];
    }

    const tag = tags.find(tag => tagName === tag.name);
    if (!tag || !tag.args) {
      return [];
    }

    return tag.args.map(arg => {
      const item = new CompletionItem(arg, CompletionItemKind.Property);
      item.insertText = new SnippetString(`${arg}=\\$\${1:${arg}}`);
      item.detail = `${arg}=$${arg}`;

      return item;
    });
  }
}

class FenomTagOptionCompletion extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    if (!this.isInMustache || !/{\w+:$/.test(this.context.textBefore)) {
      return [];
    }

    return options.map(option => {
      const item = new CompletionItem(option.name, CompletionItemKind.Function);
      item.documentation = new MarkdownString(option.description);

      return item;
    });
  }
}

const fenomTagOptionCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomTagOptionCompletion(),
  ':'
);

const fenomTagCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomTagCompletion(),
  '{'
);

const fenomTagCloseCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomTagCloseCompletion(),
  '/'
);

const fenomTagArgumentCompletionDisposable = languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomTagArgumentCompletion(),
);

export {
  fenomTagCompletionDisposable,
  fenomTagCloseCompletionDisposable,
  fenomTagArgumentCompletionDisposable,
  fenomTagOptionCompletionDisposable,
};
