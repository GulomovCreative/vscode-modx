import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msOrder';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msOrder',
  },
  {
    name: 'userFields',
  },
];

export default {
  name,
  props,
} as SnippetData;
