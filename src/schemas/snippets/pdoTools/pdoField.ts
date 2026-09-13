import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';
import { t } from '../../../localize';

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
