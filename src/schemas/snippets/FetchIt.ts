import { t } from '@vscode/l10n';
import { joinProps } from '../../common';
import { SnippetData, SnippetProp } from '../snippets/';
import { props as formItProps } from './FormIt/FormIt';

export const name = 'FetchIt';
export const description = t('FetchIt.description');
export const link = 'https://docs.modx.pro/components/fetchit/';

export const props: SnippetProp[] = joinProps([
  {
    name: 'form',
    default: 'tpl.FetchIt.example',
  },
  {
    name: 'snippet',
    default: 'FormIt',
  },
  {
    name: 'actionUrl',
    default: '[[+assetsUrl]]action.php',
  },
  {
    name: 'clearFieldsOnSuccess',
    default: 1,
  },
].map(prop => ({ ...prop, description: t(`${name}.prop.${prop.name}`) })), formItProps);

export default {
  name,
  description,
  link,
  props,
} as SnippetData;
