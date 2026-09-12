import { l10n } from 'vscode';
import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

export const name = 'FormItRetriever';
export const description = l10n.t('FormItRetriever.description');

export const link = 'formit.formitretriever';

export const props = [
  {
    name: 'placeholderPrefix',
    default: 'fi.',
  },
  {
    name: 'redirectToOnNotFound',
    type: 'number',
  },
  {
    name: 'eraseOnLoad',
    default: 0,
  },
  {
    name: 'storeLocation',
    default: 'cache',
  },
].map(prop => ({ ...prop, description: l10n.t(`${name}.prop.${prop.name}`) })) as SnippetProp[];

export default {
  name,
  description,
  link,
  props,
} as SnippetData;
