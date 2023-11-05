import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'msProducts';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: 'tpl.msProducts.row',
  },
  {
    name: 'limit',
    default: 10,
  },
  {
    name: 'depth',
    default: 10,
  },
  {
    name: 'sortby',
    default: 'id',
  },
  {
    name: 'sortbyOptions',
  },
  {
    name: 'includeThumbs',
  },
  {
    name: 'optionFilters',
  },
  {
    name: 'link',
    type: 'number',
  },
  {
    name: 'master',
    type: 'number',
  },
  {
    name: 'slave',
    type: 'number',
  },
  {
    name: 'returnIds',
    default: 1,
  },
  {
    name: 'showZeroPrice',
    default: 1,
  },
];

export default {
  name,
  props,
} as SnippetData;
