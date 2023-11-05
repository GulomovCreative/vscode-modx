import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoCrumbs';

export const props: SnippetProp[] = [
  {
    name: 'from',
    default: 0,
  },
  {
    name: 'to',
    type: 'number',
  },
  {
    name: 'exclude',
  },
  {
    name: 'toPlaceholder',
  },
  {
    name: 'outputSeparator',
    default: '\\n',
  },
  {
    name: 'tpl',
    default: {
      type: 'code',
      value: '@INLINE <li><a href="[[+link]]">[[+menutitle]]</a></li>',
    },
  },
  {
    name: 'tplCurrent',
    default: {
      type: 'code',
      value: '@INLINE <li class="active">[[+menutitle]]</li>',
    },
  },
  {
    name: 'tplMax',
    default: {
      type: 'code',
      value: '@INLINE <li class="disabled">&nbsp;...&nbsp;</li>',
    },
  },
  {
    name: 'tplHome',
  },
  {
    name: 'tplWrapper',
    default: {
      type: 'code',
      value: '@INLINE <ul class="breadcrumb">[[+output]]</ul>',
    },
  },
  {
    name: 'wrapIfEmpty',
    type: 'number',
  },
  {
    name: 'showCurrent',
    default: 1,
  },
  {
    name: 'showHome',
    default: 0,
  },
  {
    name: 'showAtHome',
    default: 1,
  },
  {
    name: 'hideSingle',
    default: 0,
  },
  {
    name: 'direction',
    default: 'ltr',
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
