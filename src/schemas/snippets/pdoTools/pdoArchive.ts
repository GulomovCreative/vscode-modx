import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoArchive';

export const props: SnippetProp[] = [
  {
    name: 'tpl',
    default: {
      type: 'code',
      value: '@INLINE <li>[[+date]] <a href="[[+link]]">[[+menutitle]]</a></li>',
    },
  },
  {
    name: 'tplYear',
    default: {
      type: 'code',
      value: '@INLINE <h3>[[+year]] <sup>([[+count]])</sup></h3><ul>[[+wrapper]]</ul>',
    },
  },
  {
    name: 'tplMonth',
    default: {
      type: 'code',
      value: '@INLINE <li><h4>[[+month_name]] <sup>([[+count]])</sup></h4><ul>[[+wrapper]]</ul></li>',
    },
  },
  {
    name: 'tplDay',
    default: {
      type: 'code',
      value: '@INLINE <li><h5>[[+day]] <sup>([[+count]])</sup></h5><ul>[[+wrapper]]</ul></li>',
    },
  },
  {
    name: 'tplWrapper',
  },
  {
    name: 'wrapIfEmpty',
  },
  {
    name: 'dateField',
    default: 'createdon',
  },
  {
    name: 'dateFormat',
    default: '%H:%M',
  },
  {
    name: 'showLog',
  },
  {
    name: 'sortby',
    default: 'createdon',
  },
  {
    name: 'sortdir',
    default: 'DESC',
  },
  {
    name: 'limit',
    type: 'number',
  },
  {
    name: 'outputSeparator',
    default: '\\n',
  },
  {
    name: 'toPlaceholder',
  },
  {
    name: 'showHidden',
    default: 1,
  },
];

export default {
  name,
  props,
} as SnippetData;
