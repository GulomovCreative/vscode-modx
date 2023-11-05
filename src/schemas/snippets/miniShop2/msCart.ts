import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msCart';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msCart',
  },
  {
    name: 'includeThumbs',
  },
];

export default {
  name,
  props,
} as SnippetData;
