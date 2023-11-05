import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoResources';

export const props: SnippetProp[] = [
  {
    name: 'showHidden',
    default: 1,
  },
  {
    name: 'sortdir',
    default: 'DESC',
  },
  {
    name: 'setTotal',
    default: 0,
  },
  {
    name: 'limit',
    default: 10,
  },
  {
    name: 'offset',
    default: 0,
  },

  {
    name: 'returnIds',
    type: 'number',
  },
  {
    name: 'tplWrapper',
  },
  {
    name: 'wrapIfEmpty',
    type: 'number',
  },

  {
    name: 'totalVar',
    default: 'total',
  },
  {
    name: 'toPlaceholder',
  },
  {
    name: 'showLog',
    default: 0,
  },
];

export default {
	name,
	props,
} as SnippetData;
