import { CompletionItem, CompletionItemKind, CompletionItemProvider, MarkdownString, Position, SnippetString, TextDocument, Command, languages, Range } from 'vscode';
import { t } from '@vscode/l10n';
import { toPath } from 'lodash';
import { FenomCompletionProvider } from './autocomplete';
import { FENOM_SELECTOR, getSortText, RETRIGGER_COMMAND } from '../../common';

import resourceFields from '../../schemas/resource';
import { userFields } from '../../schemas/user';
import { contextFields } from '../../schemas/context';
import { systemSettings } from '../../schemas/settings';

type VariableType = 'array' | 'object' | 'local' | undefined

interface Variable {
  name: string
  description?: string
  kind?: CompletionItemKind
  command?: Command
  type?: VariableType
  detail?: string
  items?: Variable[]
  value?: string
}

interface PathSegment {
  name: string
  type?: VariableType
}

const methods: Variable[] = [
  {
    name: 'lexicon',
    detail: "(string $key, array $params = [], string $language = ''): string",
  },
  {
    name: 'getChunk',
    detail: '(string $chunkName, array $properties = [], bool $fastMode = false)',
  },
  {
    name: 'parseChunk',
    detail: "(string $name, array $properties = [], string $prefix = '[[+', string $suffix = ']]')",
  },
  {
    name: 'runSnippet',
    detail: '(string $snippetName, array $params = []): mixed',
    command: RETRIGGER_COMMAND,
  },
  {
    name: 'makeUrl',
    detail: "(int $id, string $context = '', string|array $args = '', mixed $scheme = -1, array|null $options = null): string",
  },
  {
    name: 'setStore',
    detail: "(string $name, mixed $object, string $type = 'data')",
  },
  {
    name: 'getStore',
    detail: "(string $name, string $type = 'data')",
  },
  {
    name: 'regClientCSS',
    detail: "(string $src, string $media = null): void",
  },
  {
    name: 'regClientStartupScript',
    detail: '(string $src, bool $plaintext = false): void',
  },
  {
    name: 'regClientScript',
    detail: '(string $src, bool $plaintext = false): void',
  },
  {
    name: 'regClientStartupHTMLBlock',
    detail: '(string $html): void',
  },
  {
    name: 'regClientHTMLBlock',
    detail: '(string $html): void',
  },
  {
    name: 'runProcessor',
    detail: '(string $action, array $scriptProperties = [], array $options = []): mixed',
  },
  {
    name: 'hasPermission',
    detail: '(string|array $pm): bool',
  },
  {
    name: 'isAuthenticated',
    detail: '(string $sessionContext): bool',
  },
  {
    name: 'isMember',
    detail: '(string|array $groups, bool $matchAll = false): bool',
  },
  {
    name: 'hasSessionContext',
    detail: '(mixed $context): bool',
  },
  {
    name: 'findResource',
    detail: "(string $uri, string $context = ''): bool|int|mixed",
  },
  {
    name: 'sendError',
    detail: "(string $type = '', array $options = []): void",
  },
  {
    name: 'sendRedirect',
    detail: "(string $url, array $options = false, string $type = '', string $responseCode): void",
  },
  {
    name: 'sendForward',
    detail: '(integer $id, string|array $options = null): void',
  },
  {
    name: 'setPlaceholder',
    detail: '(string $key, mixed $value): void',
  },
  {
    name: 'setPlaceholders',
    detail: "(array|object $placeholders, string $namespace = ''): void",
  },
  {
    name: 'toPlaceholders',
    detail: "(array|object $subject, string $prefix = '', string $separator = '.', boolean $restore = false): array",
  },
  {
    name: 'toPlaceholder',
    detail: "(string $key, mixed $value, string $prefix = '', string $separator = '.', boolean $restore = false): array",
  },
  {
    name: 'getPlaceholders',
    detail: '(): array',
  },
  {
    name: 'getPlaceholder',
    detail: '(string $key): mixed',
  },
  {
    name: 'unsetPlaceholder',
    detail: '(string $key): void',
  },
  {
    name: 'unsetPlaceholders',
    detail: '(string|array $keys): void',
  },
  {
    name: 'getChildIds',
    detail: '(integer $id = null, integer $depth = 10, array $options = []): array',
  },
  {
    name: 'getParentIds',
    detail: '(integer $id = null, integer $height = 10, array $options = []): array',
  },
  {
    name: 'getInfo',
    detail: "(string $key = '', bool $string = true, string $tpl = '@INLINE {$key}: {$value}'): array|string",
  },
  {
    name: 'getResource',
    detail: '(array|integer $id, array $options = []): array|bool',
  },
  {
    name: 'getResources',
    detail: '(array $where, array $options = []): array|bool',
  },
  {
    name: 'cleanAlias',
    detail: "(string $alias): string|null",
  },
].map(data => ({ ...data, description: t(`var.$_modx.method.${data.name}`) }));

let map: Variable[] = [
  {
    name: '$_modx',
    type: 'object',
    description: t('var.$_modx'),
    kind: CompletionItemKind.Class,
    items: [
      {
        name: 'resource',
        description: t('var.$_modx.resource'),
        items: resourceFields.map(name => ({ name, description: t(`resource.${name}`) })),
      },
      {
        name: 'user',
        description: t('var.$_modx.user'),
        items: userFields.map(name => ({ name, description: t(`user.${name}`) })),
      },
      {
        name: 'context',
        description: t('var.$_modx.context'),
        items: contextFields.map(name => ({ name, description: t(`context.${name}`) })),
      },
      {
        name: 'config',
        description: t('var.$_modx.config'),
        items: systemSettings.map(name => ({ name, description: t(`setting.${name}`) })),
      },

      {
        name: 'lexicon',
        kind: CompletionItemKind.Module,
        type: 'object',
        description: t('var.$_modx.lexicon'),
        items: [
          {
            name: 'load',
            detail: 'load(string $key): void',
            kind: CompletionItemKind.Method,
            description: t('var.$_modx.lexicon.load'),
          },
        ],
      },
      {
        name: 'cacheManager',
        kind: CompletionItemKind.Module,
        type: 'object',
        description: t('var.$_modx.cacheManager'),
        items: [
          {
            name: 'get',
            detail: 'get(string $key, array $options = []): mixed',
            kind: CompletionItemKind.Method,
            description: t('var.$_modx.cacheManager.get'),
          },
          {
            name: 'set',
            detail: 'set(string $key, mixed $var, integer $lifetime = 0): bool',
            kind: CompletionItemKind.Method,
            description: t('var.$_modx.cacheManager.set'),
          },
        ],
      },

      ...methods.map(param => ({ ...param, kind: CompletionItemKind.Method })),
    ],
  },
  {
    name: '$',
    description: t('var.$'),
    kind: CompletionItemKind.Class,
    items: [
      ...[
        'env',
        'get',
        'post',
        'files',
        'cookie',
        'server',
        'session',
        'globals',
        'request',
        'version',
        'const',
        'call',
        'block',
      ].map(name => ({ name, description: t(`var.$.${name}`) })),
      {
        name: 'tpl',
        description: t('var.$.tpl'),
        items: [
          'name',
          'basename',
          'scm',
          'options',
          'depends',
          'time',
        ].map(name => ({ name, description: t(`var.$.tpl.${name}`) })),
      },
    ],
  },
];

class FenomVariablesProvider extends FenomCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ) {
    this.createContext(position, document);

    if (!this.shouldProvide()) {
      return [];
    }

    this.prepareLocaleVariables();

    return this.getCompletionItems();
  }

  getCompletionItems(): CompletionItem[] {
    const { textBefore } = this.context;

    let [ match ] = textBefore.match(/\$[\w.[\]'"\->]*$/) || [];
    match = match?.replace(/\[['"]$/, '.');
    const path = this.parsePath(match);
    const items = this.getItems([...path]);

    return items.map((variable, index) => this.createCompletionItem(variable, index));
  }

  createCompletionItem(
    variable: Variable,
    index: number,
  ): CompletionItem {
    const item = new CompletionItem(variable.name, variable.kind || CompletionItemKind.Field);
    item.documentation = new MarkdownString(variable.description);
    item.sortText = getSortText(index, variable.name);

    item.detail = variable.detail;
    item.insertText = variable.name.replace(/^\$/, '');

    if (
      variable.kind === CompletionItemKind.Method
      && variable.detail
      && !/^\(/.test(this.context.textAfter)
    ) {
      let body = "'$1'";

      if (variable.command) {
        item.command = variable.command;
      } else {
        const [ args ] = variable.detail.match(/\((.*)\)(: (.*))?/) || [];

        if (args) {
          const argsArray = args.split(', ').reduce((result, arg) => {
            const [ , type, name, , defaultValue ] = arg.match(/([\w|]*) \$(\w*)( = ([\w|]*))?/) || [];

            if (
              typeof defaultValue === 'undefined'
              && name
            ) {
              let str = `\${${result.length}:${name}}`;

              if (type === 'string') {
                str = `'${str}'`;
              }

              result.push(str);
            }

            return result;
          }, [] as string[]);

          body = argsArray.join(', ');
        }
      }

      item.insertText = new SnippetString(`${item.insertText}(${body})`);
    }

    if (!this.isInMustacheBlock) {
      item.insertText = new SnippetString(`{\\$${item.insertText}$0}`);
      item.range = new Range(
        this.context.wordRange.start.translate({ characterDelta: -1 }),
        this.context.wordRange.end,
      );
    }

    return item;
  }

  prepareLocaleVariables() {
    const before = this.getBefore();
    const matches = [...before.matchAll(/{(set|add|var)\s*(\$[a-zA-Z_]+[a-zA-Z0-9_]+)\s*=\s*([^'"}]*(("[^"]*"|'[^']*')[^'"}]*)*)}/gm)] || [];
    const unsettedMatches = [...before.matchAll(/(?<!{\*\s*){unset\s*(\$[\w $]*)(?=})/g)] || [];
    const unsetted = unsettedMatches
        .reduce((result, [ , match ]) => {
          match.replace(/\s+/g, ' ').trim().split(' ').forEach((item) => result.push(item));
          return result;
        }, [] as string[]);

    const variables: Variable[] = matches
        .map<Variable>(([ detail, , name, value ]) => {
          const detailLines = detail.split('\n');
          const data: Variable = {
            name,
            detail: detailLines.length > 1 ? (detailLines[0] + '...') : detail,
            type: 'local',
            value,
            kind: CompletionItemKind.Variable
          };
          const path = this.parsePath(value + '.');
          const items = this.getItems(path);

          if (items) {
            data.items = items;
          }

          return data;
        })
        .filter((variable) => !unsetted.includes(variable.name));

    map = map.filter(item => item.type !== 'local');

    const tags = this.getParentTags();

    for (const tag of tags) {
      if (tag.name !== 'foreach') {
        continue;
      }

      const [ , itemOrKey, , item ] = tag.body.match(/as\s+(\$\w+)(\s*=>\s*(\$\w+))?/) || [];
      const [ , index ] = tag.body.match(/index=(\$\w+)/) || [];
      const [ , first ] = tag.body.match(/first=(\$\w+)/) || [];
      const [ , last ] = tag.body.match(/last=(\$\w+)/) || [];

      const blockVars: Variable[] = [
        {
          name: itemOrKey,
          description: t(`var.foreach.${item ? 'key' : 'item'}`),
        },
        {
          name: item,
          description: t('var.foreach.item'),
        },
        {
          name: index,
          description: t('var.foreach.index'),
        },
        {
          name: first,
          description: t('var.foreach.first'),
        },
        {
          name: last,
          description: t('var.foreach.last'),
        },
      ];

      for (const { name, description } of blockVars) {
        if (!name) {
          continue;
        }

        variables.unshift({
          name,
          description,
          detail: name,
          type: 'local',
          kind: CompletionItemKind.Variable,
        });
      }
    }

    map.push(...variables);
  }

  shouldProvide(): boolean {
    if (
      /(?<!\$)\$[\w.[\]'"\->]*$/.test(this.context.textBefore)
    ) {
      return true;
    }

    return false;
  }

  parsePath(path = ''): PathSegment[] {
    if (!path) {
      return [];
    }

    const output = path.split('->').reduce((result, segment) => {
      const paths = toPath(segment);

      if (paths.length > 1) {
        paths.forEach((seg) => result.push({ name: seg }));
      } else {
        result.push({ name: segment, type: 'object' });
      }

      return result;
    }, [] as PathSegment[]);

    return output;
  }

  getItems(path: PathSegment[]): Variable[] {
    if (!path) {
      return [];
    }

    if (path.length === 1) {
      return map;
    }

    path.pop();
    const items = this.findItems(path, map);

    return items;
  }

  findItems(path: PathSegment[], items: Variable[]): Variable[] {
    if (!path.length) {
      return [];
    }

    const firstSegment = path[0];
    const item = items.find(item => item.name === firstSegment.name && (item.type === firstSegment.type || item.type === 'local'));

    if (!item || !item.items) {
      return [];
    }

    if (path.length === 1) {
      return item.items;
    }

    path.shift();
    return this.findItems(path, item.items);
  }
}

export default languages.registerCompletionItemProvider(
  FENOM_SELECTOR,
  new FenomVariablesProvider(),
  '$',
  '>',
  '.',
  '\'',
  '"'
);
