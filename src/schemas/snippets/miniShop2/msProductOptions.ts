import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msProductOptions';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msProductOptions',
  },
  {
    name: 'product',
    type: 'number',
  },
  {
    name: 'onlyOptions',
  },
  {
    name: 'ignoreOptions',
  },
  {
    name: 'groups',
  },
];

export default {
  name,
  props,
} as SnippetData;
