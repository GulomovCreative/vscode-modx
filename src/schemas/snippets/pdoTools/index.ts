import { joinProps } from '../../../common';
import { SnippetData, SnippetProp } from '../../snippets/';

import pdoResourcesData from './pdoResources';
import pdoNeighborsData from './pdoNeighbors';
import pdoArchiveData from './pdoArchive';
import pdoSitemapData from './pdoSitemap';
import pdoCrumbsData from './pdoCrumbs';
import pdoUsersData from './pdoUsers';
import pdoFieldData from './pdoField';
import pdoTitleData from './pdoTitle';
import pdoMenuData from './pdoMenu';
import pdoPageData from './pdoPage';

import { t } from '@vscode/l10n';

class PdoSnippet implements SnippetData {
  name: string;
  description: string;
  link?: string;
  props: SnippetProp[];

  constructor ({
    name,
    props,
  }: SnippetData) {
    this.name = name;
    this.description = t(`${name}.description`);
    this.link = 'https://docs.modx.pro/components/pdotools/snippets/' + name.toLowerCase();
    this.props = joinProps(
      props.map(prop => ({ ...prop, description: t(`${name}.prop.${prop.name}`) })),
      commonProps.map(prop => ({ ...prop, description: t(`pdoTools.prop.${prop.name}`) }))
    );
  }
}

export const commonProps: SnippetProp[] = [
  {
    name: 'class',
    default: 'modResource',
  },
  {
    name: 'parents',
    default: {
      type: 'text',
      value: t('pdoTools.prop.parents.default'),
    },
  },
  {
    name: 'depth',
    default: 10,
  },
  {
    name: 'resources',
  },
  {
    name: 'templates',
  },
  {
    name: 'context',
  },
  {
    name: 'where',
  },
  {
    name: 'showHidden',
    default: 0,
  },
  {
    name: 'showUnpublished',
    default: 0,
  },
  {
    name: 'showDeleted',
    default: 0,
  },
  {
    name: 'hideContainers',
    default: 0,
  },
  {
    name: 'hideUnsearchable',
    type: 'number',
  },
  {
    name: 'select',
    example: '{"modResource":"id,pagetitle,content"}',
  },
  {
    name: 'leftJoin',
  },
  {
    name: 'rightJoin',
  },
  {
    name: 'innerJoin',
  },
  {
    name: 'joinSequence',
    default: 'innerJoin,leftJoin,rightJoin',
  },
  {
    name: 'sortby',
    default: 'pagetitle',
  },
  {
    name: 'sortdir',
    default: 'ASC',
  },
  {
    name: 'groupby',
  },
  {
    name: 'having',
  },
  {
    name: 'limit',
    default: 0,
  },
  {
    name: 'offset',
    default: 0,
  },
  {
    name: 'first',
    default: 1,
  },
  {
    name: 'last',
    type: 'number',
    default: {
      type: 'text',
      value: t('pdoTools.prop.last.default'),
    },
  },
  {
    name: 'loadModels',
    example: 'ms2gallery,msearch2',
  },
  {
    name: 'tvFilters',
    example: 'filter2==one,filter1==bar%',
  },
  {
    name: 'tvFiltersAndDelimiter',
    default: ',',
  },
  {
    name: 'tvFiltersOrDelimiter',
    default: '||',
  },
  {
    name: 'sortbyTV',
  },
  {
    name: 'sortdirTV',
  },
  {
    name: 'sortbyTVType',
  },
  {
    name: 'checkPermissions',
    example: 'list',
  },
  {
    name: 'disableConditions',
  },
  {
    name: 'fenomModifiers',
  },

  {
    name: 'tpl',
  },
  {
    name: 'tplFirst',
  },
  {
    name: 'tplLast',
  },
  {
    name: 'tplOdd',
  },
  {
    name: 'tpl_N',
    insertText: 'tpl_${1:N}=`$0`',
  },
  {
    name: 'tpl_nN',
    insertText: 'tpl_n${1:N}=`$0`',
  },
  {
    name: 'tplCondition',
  },
  {
    name: 'tplOperator',
  },
  {
    name: 'conditionalTpls',
  },
  {
    name: 'outputSeparator',
  },

  {
    name: 'return',
    default: 'chunks',
  },
  {
    name: 'fastMode',
    default: 0,
  },
  {
    name: 'nestedChunkPrefix',
    default: 'pdotools_',
  },
  {
    name: 'idx',
    type: 'number',
  },
  {
    name: 'totalVar',
    default: 'total',
  },
  {
    name: 'includeContent',
    default: 0,
  },
  {
    name: 'includeTVs',
  },
  {
    name: 'includeTVList',
  },
  {
    name: 'prepareTVs',
    default: 1,
  },
  {
    name: 'processTVs',
    default: 1,
  },
  {
    name: 'tvPrefix',
    default: 'tv.',
  },
  {
    name: 'prepareSnippet',
    default: 1,
  },
  {
    name: 'decodeJSON',
  },
  {
    name: 'scheme',
    default: -1,
  },
  {
    name: 'useWeblinkUrl',
    type: 'number',
  },
  {
    name: 'toSeparatePlaceholders',
  },
  {
    name: 'additionalPlaceholders',
  },
  {
    name: 'cache_key',
    default: {
      type: 'text',
      value: t('pdoTools.prop.cache_key.default'),
    },
  },
  {
    name: 'cache_handler',
    default: {
      type: 'text',
      value: t('pdoTools.prop.cache_handler.default'),
    },
  },
  {
    name: 'cacheTime',
    type: 'number',
    default: {
      type: 'text',
      value: t('pdoTools.prop.cacheTime.default'),
    },
  },
];

export const pdoResources = new PdoSnippet(pdoResourcesData);
export const pdoNeighbors = new PdoSnippet(pdoNeighborsData);
export const pdoArchive = new PdoSnippet(pdoArchiveData);
export const pdoSitemap = new PdoSnippet(pdoSitemapData);
export const pdoCrumbs = new PdoSnippet(pdoCrumbsData);
export const pdoField = new PdoSnippet(pdoFieldData);
export const pdoTitle = new PdoSnippet(pdoTitleData);
export const pdoUsers = new PdoSnippet(pdoUsersData);
export const pdoMenu = new PdoSnippet(pdoMenuData);
export const pdoPage = new PdoSnippet(pdoPageData);

export default [
  pdoResources,
  pdoNeighbors,
  pdoArchive,
  pdoSitemap,
  pdoCrumbs,
  pdoField,
  pdoTitle,
  pdoUsers,
  pdoMenu,
  pdoPage,
];
