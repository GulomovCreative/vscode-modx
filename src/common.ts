import { SnippetProp } from './schemas/snippets/';

export const MODX_SELECTOR = { language: 'modx' };
export const FENOM_SELECTOR = { language: 'fenom' };
export const SELECTORS = [MODX_SELECTOR, FENOM_SELECTOR];

export const RETRIGGER_COMMAND = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };

export function getSortText (
  index: number,
  name: string,
): string {
  return String(index).padStart(3) + '-' + name;
}

export function joinProps(
  props: SnippetProp[],
  commonProps: SnippetProp[] = [],
): SnippetProp[] {
  const filtered = commonProps.filter(cProp => !props.some(prop => prop.name === cProp.name));

  return [
    ...props,
    ...filtered,
  ];
}
