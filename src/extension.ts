import { type ExtensionContext, extensions, window } from 'vscode';
import './localize';

import { modxSnippetCompletionDisposable, modxSnippetPropCompletionDisposable } from './providers/modx/snippet';
import modxModifierCompletionDisposable from './providers/modx/modifier';
import modxPlaceholderCompletionDisposable from './providers/modx/placeholder';
import modxSettingCompletionDisposable from './providers/modx/setting';
import modxChunkCompletionDisposable from './providers/modx/chunk';

import fileCompletionDisposable from './providers/file/autocomplete';
import fileLocationDisposable from './providers/file/definition';

import { fenomTagCompletionDisposable, fenomTagCloseCompletionDisposable, fenomTagArgumentCompletionDisposable, fenomTagOptionCompletionDisposable } from './providers/fenom/tag';
import fenomVariablesCompletionDisposable from './providers/fenom/variable';
import { fenomModifierCompletionDisposable, fenomConfigModifierCompletionDisposable } from './providers/fenom/modifier';
import { fenomSnippetModifierCompletionDisposable, fenomSnippetMethodCompletionDisposable, fenomSnippetPropCompletionDisposable } from './providers/fenom/snippet';
import fenomArgumentCompletionDisposable from './providers/fenom/argument';

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(
    modxModifierCompletionDisposable,
    modxSnippetCompletionDisposable,
    modxSnippetPropCompletionDisposable,
    modxPlaceholderCompletionDisposable,
    modxSettingCompletionDisposable,
    modxChunkCompletionDisposable,

    fenomTagCompletionDisposable,
    fenomTagCloseCompletionDisposable,
    fenomTagArgumentCompletionDisposable,
    fenomTagOptionCompletionDisposable,

    fenomModifierCompletionDisposable,
    fenomConfigModifierCompletionDisposable,
    fenomVariablesCompletionDisposable,

    fenomSnippetModifierCompletionDisposable,
    fenomSnippetMethodCompletionDisposable,
    fenomSnippetPropCompletionDisposable,
    fenomArgumentCompletionDisposable,

    fileLocationDisposable,
    fileCompletionDisposable,
  );

  const htmlExtension = extensions.getExtension('vscode.html-language-features');

  if (!htmlExtension) {
    const output = window.createOutputChannel('vscode-modx');

    output.appendLine(
      'Warning: Could not find vscode.html-language-features.',
    );

    return;
  }

  await htmlExtension?.activate();
}
