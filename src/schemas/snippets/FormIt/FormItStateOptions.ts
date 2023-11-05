import { t } from '@vscode/l10n';
import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'FormItStateOptions';
export const description = t('FormItStateOptions.description');

export const link = 'formit.formitstateoptions';

export const props = [
  {
    name: 'selected',
  },
  {
    name: 'selectedAttribute',
    default: 'selected="selected"',
  },
  {
    name: 'tpl',
  },
  {
    name: 'useAbbr',
    default: 1,
  },
  {
    name: 'toPlaceholder',
  },
].map(prop => ({ ...prop, description: t(`${name}.prop.${prop.name}`) })) as SnippetProp[];

export default {
  name,
  description,
  link,
  props,
} as SnippetData;
