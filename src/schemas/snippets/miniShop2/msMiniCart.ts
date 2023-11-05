import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msMiniCart';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msMiniCart',
  },
];

export default {
  name,
  props,
} as SnippetData;
