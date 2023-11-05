import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'pdoPage';

export const props: SnippetProp[] = [
  {
    name: 'plPrefix',
  },
  {
    name: 'limit',
    default: 10,
  },
  {
    name: 'maxLimit',
    default: 100,
  },
  {
    name: 'page',
    default: 1,
  },
  {
    name: 'pageVarKey',
    default: 'page',
  },
  {
    name: 'totalVar',
    default: 'page.total',
  },
  {
    name: 'pageLimit',
    default: 5,
  },
  {
    name: 'element',
    default: 'pdoResources',
  },
  {
    name: 'pageNavVar',
    default: 'page.nav',
  },
  {
    name: 'pageCountVar',
    default: 'pageCount',
  },
  {
    name: 'pageLinkScheme',
  },
  {
    name: 'cache',
    default: 0,
  },
  {
    name: 'cache_user',
    type: 'number',
  },
  {
    name: 'toPlaceholder',
  },
  {
    name: 'ajax',
    default: 1,
  },
  {
    name: 'ajaxMode',
  },
  {
    name: 'ajaxElemWrapper',
    default: '#pdopage',
  },
  {
    name: 'ajaxElemRows',
    default: '#pdopage .rows',
  },
  {
    name: 'ajaxElemPagination',
    default: '#pdopage .pagination',
  },
  {
    name: 'ajaxElemLink',
    default: '#pdopage .pagination a',
  },
  {
    name: 'ajaxElemMore',
    default: '#pdopage .btn-more',
  },
  {
    name: 'ajaxHistory',
    type: 'number',
  },
  {
    name: 'frontend_js',
    default: '[[+assetsUrl]]js/pdopage.min.js',
  },
  {
    name: 'frontend_css',
    default: '[[+assetsUrl]]css/pdopage.min.css',
  },
  {
    name: 'setMeta',
    default: 1,
  },
  {
    name: 'strictMode',
    default: 1,
  },

  {
    name: 'tplPage',
    default: {
      type: 'code',
      value: '@INLINE <li><a href="[[+href]]">[[+pageNo]]</a></li>',
    },
  },
  {
    name: 'tplPageWrapper',
    default: {
      type: 'code',
      value: '@INLINE <div class="pagination"><ul class="pagination">[[+first]][[+prev]][[+pages]][[+next]][[+last]]</ul></div>',
    },
  },
  {
    name: 'tplPageActive',
    default: {
      type: 'code',
      value: '@INLINE <li class="active"><a href="[[+href]]">[[+pageNo]]</a></li>',
    },
  },
  {
    name: 'tplPageFirst',
    default: {
      type: 'code',
      value: '@INLINE <li class="control"><a href="[[+href]]">[[%pdopage_first]]</a></li>',
    },
  },
  {
    name: 'tplPageLast',
    default: {
      type: 'code',
      value: '@INLINE <li class="control"><a href="[[+href]]">[[%pdopage_last]]</a></li>',
    },
  },
  {
    name: 'tplPagePrev',
    default: {
      type: 'code',
      value: '@INLINE <li class="control"><a href="[[+href]]">&laquo;</a></li>',
    },
  },
  {
    name: 'tplPageNext',
    default: {
      type: 'code',
      value: '@INLINE <li class="control"><a href="[[+href]]">&raquo;</a></li>',
    },
  },
  {
    name: 'tplPageSkip',
    default: {
      type: 'code',
      value: '@INLINE <li class="disabled"><span>...</span></li>',
    },
  },
  {
    name: 'tplPageFirstEmpty',
    default: {
      type: 'code',
      value: '@INLINE <li class="control"><span>[[%pdopage_first]]</span></li>',
    },
  },
  {
    name: 'tplPageLastEmpty',
    default: {
      type: 'code',
      value: '@INLINE <li class="control"><span>[[%pdopage_last]]</span></li>',
    },
  },
  {
    name: 'tplPagePrevEmpty',
    default: {
      type: 'code',
      value: '@INLINE <li class="disabled"><span>&laquo;</span></li>',
    },
  },
  {
    name: 'tplPageNextEmpty',
    default: {
      type: 'code',
      value: '@INLINE <li class="disabled"><span>&raquo;</span></li>',
    },
  },
  {
    name: 'ajaxTplMore',
    default: {
      type: 'code',
      value: '@INLINE <button class="btn btn-default btn-more">[[%pdopage_more]]</button>',
    },
  },
];

export default {
  name,
  props,
} as SnippetData;
