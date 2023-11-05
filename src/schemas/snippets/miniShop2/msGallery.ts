import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msGallery';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msGallery',
  },
  {
    name: 'product',
    type: 'number',
  },
  {
    name: 'sortby',
    default: 'rank',
  },
  {
    name: 'filetype',
    example: 'image,pdf,xls,doc',
  },
];

export default {
  name,
  props,
} as SnippetData;
