import { type ExtensionContext, extensions, window } from 'vscode';
import './localize';

import { registerModxSnippetCompletion, registerModxSnippetPropCompletion } from './providers/modx/snippet';
import registerModxModifierCompletion from './providers/modx/modifier';
import registerModxPlaceholderCompletion from './providers/modx/placeholder';
import registerModxSettingCompletion from './providers/modx/setting';
import registerModxFastFieldCompletion from './providers/modx/fastfield';
import registerModxChunkCompletion from './providers/modx/chunk';

import registerFileCompletion from './providers/file/autocomplete';
import registerFileDefinition from './providers/file/definition';

import { registerFenomTagCompletion, registerFenomTagCloseCompletion, registerFenomTagArgumentCompletion, registerFenomTagOptionCompletion } from './providers/fenom/tag';
import registerFenomVariablesCompletion from './providers/fenom/variable';
import { registerFenomModifierCompletion, registerFenomConfigModifierCompletion } from './providers/fenom/modifier';
import { registerFenomSnippetModifierCompletion, registerFenomSnippetMethodCompletion, registerFenomSnippetPropCompletion } from './providers/fenom/snippet';
import registerFenomArgumentCompletion from './providers/fenom/argument';
import registerFenomBlockNameCompletion from './providers/fenom/block';

import { registerDocumentFormatting, registerRangeFormatting } from './providers/format';


export async function activate(context: ExtensionContext) {
  context.subscriptions.push(
    registerModxModifierCompletion(),
    registerModxSnippetCompletion(),
    registerModxSnippetPropCompletion(),
    registerModxPlaceholderCompletion(),
    registerModxSettingCompletion(),
    registerModxFastFieldCompletion(),
    registerModxChunkCompletion(),

    registerFenomTagCompletion(),
    registerFenomTagCloseCompletion(),
    registerFenomTagArgumentCompletion(),
    registerFenomTagOptionCompletion(),
    registerFenomBlockNameCompletion(),

    registerFenomModifierCompletion(),
    registerFenomConfigModifierCompletion(),
    registerFenomVariablesCompletion(),

    registerFenomSnippetModifierCompletion(),
    registerFenomSnippetMethodCompletion(),
    registerFenomSnippetPropCompletion(),
    registerFenomArgumentCompletion(),

    registerFileDefinition(),
    registerFileCompletion(),

    registerDocumentFormatting(),
    registerRangeFormatting(),
  );

  const htmlExtension = extensions.getExtension('vscode.html-language-features');

  if (!htmlExtension) {
    const output = window.createOutputChannel('vscode-modx');
    context.subscriptions.push(output);

    output.appendLine(
      'Warning: Could not find vscode.html-language-features.',
    );

    return;
  }

  await htmlExtension.activate();
}
