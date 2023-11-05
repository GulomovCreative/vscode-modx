import { t } from '@vscode/l10n';
import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoNeighbors';

export const props: SnippetProp[] = [
  {
    name: 'id',
    type: 'number',
    default: {
      type: 'text',
      value: t(`${name}.prop.id.default`),
    },
  },
  {
    name: 'loop',
    default: 1,
  },
  {
    name: 'tplPrev',
    default: {
      type: 'code',
      value: '@INLINE <span class="link-prev"><a href="/[[+uri]]">&larr; [[+menutitle]]</a></span>',
    },
  },
  {
    name: 'tplUp',
    default: {
      type: 'code',
      value: '@INLINE <span class="link-up">&uarr; <a href="/[[+uri]]">[[+menutitle]]</a></span>',
    },
  },
  {
    name: 'tplNext',
    default: {
      type: 'code',
      value: '@INLINE <span class="link-next"><a href="/[[+uri]]">[[+menutitle]] &rarr;</a></span>',
    },
  },
  {
    name: 'tplWrapper',
    default: {
      type: 'code',
      value: '@INLINE <div class="neighbors">[[+prev]][[+up]][[+next]]</div>',
    },
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
