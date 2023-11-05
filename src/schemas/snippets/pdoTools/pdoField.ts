import { t } from '@vscode/l10n';
import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoField';

export const props: SnippetProp[] = [
  {
    name: 'id',
    type: 'number',
    default: {
      type: 'text',
      value: t(`${name}.prop.id.default`),
    },
  },
  {
    name: 'field',
    default: 'pagetitle',
  },
  {
    name: 'top',
    type: 'number',
  },
  {
    name: 'topLevel',
    type: 'number',
  },
  {
    name: 'default',
  },
  {
    name: 'output',
  },
  {
    name: 'toPlaceholder',
  },
];

export default {
  name,
  props,
} as SnippetData;
