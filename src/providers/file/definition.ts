import { DefinitionProvider, TextDocument, Position, LocationLink, Uri, Range, languages } from 'vscode';
import { createContext, getElementsUri, pathSegments } from './autocomplete';
import { SELECTORS } from '../../common';

class FileDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position
  ): LocationLink[] {
    const { isInclude, inputRange, input } = createContext(position, document);

    if (!isInclude) {
      return [];
    }

    const base = getElementsUri(document);

    if (!base) {
      return [];
    }

    const file: LocationLink = {
      originSelectionRange: inputRange,
      targetUri: Uri.joinPath(base, ...pathSegments(input)),
      targetRange: new Range(new Position(0, 0), new Position(0, 0)),
    };

    return [file];
  }
}

export default () => languages.registerDefinitionProvider(
  SELECTORS,
  new FileDefinitionProvider(),
);
