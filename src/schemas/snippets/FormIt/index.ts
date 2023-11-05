import type { SnippetData, SnippetProp } from '../../../schemas/snippets/';

import FormItData from './FormIt';
import FormItRetrieverData from './FormItRetriever';
import FormItStateOptionsData from './FormItStateOptions';

class FormItSnippet implements SnippetData {
  name: string;
  description: string;
  link?: string;
  props: SnippetProp[];

  constructor ({
    name,
    description,
    link,
    props,
  }: SnippetData) {
    this.name = name;
    this.description = description;
    this.link = 'https://docs.modx.com/current/ru/extras/formit/' + link;
    this.props = props;
  }
}

export const FormIt = new FormItSnippet(FormItData);
export const FormItRetriever = new FormItSnippet(FormItRetrieverData);
export const FormItStateOptions = new FormItSnippet(FormItStateOptionsData);

export default [
  FormIt,
  FormItRetriever,
  FormItStateOptions,
];
