import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoSitemap';

export const props: SnippetProp[] = [
  {
    name: 'sitemapSchema',
    default: '<http://www.sitemaps.org/schemas/sitemap/0.9>',
  },
  {
    name: 'forceXML',
    default: 1,
  },
  {
    name: 'priorityTV',
    default: 1,
  },
];

export default {
  name,
  props,
} as SnippetData;
