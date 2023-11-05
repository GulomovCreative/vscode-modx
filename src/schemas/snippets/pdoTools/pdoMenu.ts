import { t } from '@vscode/l10n';
import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoMenu';

export const props: SnippetProp[] = [
  {
    name: 'level',
    type: 'number',
    default: {
      type: 'text',
      value: t(`${name}.prop.level.default`),
    },
  },
  {
    name: 'displayStart',
    default: 0,
  },
  {
    name: 'previewUnpublished',
    default: 0,
  },
  {
    name: 'hideSubMenus',
    default: 0,
  },
  {
    name: 'sortby',
    default: 'menuindex',
  },
  {
    name: 'sortdir',
    default: 'ASC',
  },
  {
    name: 'offset',
    default: 0,
  },
  {
    name: 'countChildren',
    default: 0,
  },
  {
    name: 'toPlaceholder',
  },
  {
    name: 'plPrefix',
    default: 'wf.',
  },
  {
    name: 'showLog',
    default: 0,
  },
  {
    name: 'cache',
    default: 0,
  },
  {
    name: 'rowIdPrefix',
  },
  {
    name: 'hereId',
    type: 'number',
  },

  {
    name: 'tplOuter',
    default: {
      type: 'code',
      value: '@INLINE <ul [[+classes]]>[[+wrapper]]</ul>',
    },
  },
  {
    name: 'tpl',
    default: {
      type: 'code',
      value: '@INLINE <li [[+classes]]><a href="[[+link]]" [[+attributes]]>[[+menutitle]]</a>[[+wrapper]]</li>',
    },
  },
  {
    name: 'tplHere',
  },
  {
    name: 'tplStart',
    default: {
      type: 'code',
      value: '@INLINE <h2 [[+classes]]>[[+menutitle]]</h2>[[+wrapper]]',
    },
  },
  {
    name: 'tplParentRow',
    example: '@INLINE <li class="submenu_wrapp [[+classnames]]"><a href="[[+link]]" [[+attributes]]>[[+menutitle]]</a>[[+wrapper]]</li>',
  },
  {
    name: 'tplParentRowHere',
  },
  {
    name: 'tplParentRowActive',
  },
  {
    name: 'tplCategoryFolder',
  },
  {
    name: 'tplInner',
    example: '@INLINE <ul class="submenu [[+classnames]]">[[+wrapper]]</ul>',
  },
  {
    name: 'tplInnerRow',
    example: '@INLINE <li class="submenu_item [[+classnames]]"><a href="[[+link]]" [[+attributes]]>[[+menutitle]]</a>[[+wrapper]]</li>',
  },
  {
    name: 'tplInnerHere',
  },

  {
    name: 'firstClass',
    default: 'first',
  },
  {
    name: 'lastClass',
    default: 'last',
  },
  {
    name: 'hereClass',
    default: 'active',
  },
  {
    name: 'parentClass',
  },
  {
    name: 'rowClass',
  },
  {
    name: 'outerClass',
  },
  {
    name: 'innerClass',
  },
  {
    name: 'levelClass',
  },
  {
    name: 'selfClass',
  },
  {
    name: 'webLinkClass',
  },
];

export default {
  name,
  props,
} as SnippetData;
