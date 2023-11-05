import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoTitle';

export const props: SnippetProp[] = [
  {
    name: 'id',
    default: 0,
  },
  {
    name: 'limit',
    default: 3,
  },
  {
    name: 'titleField',
    default: 'longtitle',
  },
  {
    name: 'cache',
    default: 0,
  },
  {
    name: 'cacheTime',
    default: 0,
  },
  {
    name: 'tplPages',
    default: '@INLINE ...',
  },
  {
    name: 'pageVarKey',
    default: 'page',
  },
  {
    name: 'tplSearch',
    default: '@INLINE ...',
  },
  {
    name: 'queryVarKey',
    default: 'query',
  },
  {
    name: 'minQuery',
    default: 3,
  },
  {
    name: 'outputSeparator',
    default: '/',
  },
  {
    name: 'registerJs',
    default: 1,
  },
];

export default {
  name,
  props,
} as SnippetData;
