import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msGetOrder';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msGetOrder',
  },
  {
    name: 'includeThumbs',
  },
];

export default {
  name,
  props,
} as SnippetData;
