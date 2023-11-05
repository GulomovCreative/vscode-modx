import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msOptions';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msOptions',
  },
  {
    name: 'product',
    type: 'number',
  },
  {
    name: 'options',
  },
];

export default {
  name,
  props,
} as SnippetData;
