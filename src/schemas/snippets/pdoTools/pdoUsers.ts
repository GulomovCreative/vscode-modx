import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoUsers';

export const props: SnippetProp[] = [
  {
    name: 'groups',
  },
  {
    name: 'roles',
  },
  {
    name: 'users',
  },
  {
    name: 'showInactive',
    default: 0,
  },
  {
    name: 'showBlocked',
    default: 0,
  },
  {
    name: 'returnIds',
    type: 'number',
  },
  {
    name: 'showLog',
    default: 0,
  },
  {
    name: 'toPlaceholder',
  },
  {
    name: 'wrapIfEmpty',
  },
  {
    name: 'tplWrapper',
  },

  {
    name: 'class',
    default: 'modUser',
  },
  {
    name: 'sortby',
    default: 'modUser.id',
  },
];

export default {
  name,
  props,
} as SnippetData;
