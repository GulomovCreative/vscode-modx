import {
  Diagnostic,
  DiagnosticSeverity,
  Disposable,
  Range,
  TextDocument,
  Uri,
  l10n,
  languages,
  workspace,
} from 'vscode';

import { findProblems, type DiagnosticLevel } from '../diagnostics';
import { getDocumentText } from '../cache';
import { type TemplateLanguage } from '../scanner';

const LANGUAGES = new Set(['modx', 'fenom']);

// Шаблон в процессе набора почти всегда «сломан»: половина тегов ещё не
// дописана. Ошибкой это помечать нельзя — красное подчёркивание на каждой
// второй букве мешает больше, чем помогает.
const SEVERITY = DiagnosticSeverity.Warning;

// Пересчёт на каждое нажатие не нужен: диагностика — не подсказка, её читают
// глазами после паузы.
const DEBOUNCE_MS = 300;

function level(): DiagnosticLevel {
  return workspace.getConfiguration('vscode-modx').get<DiagnosticLevel>('diagnostics') ?? 'unclosed';
}

function build(document: TextDocument): Diagnostic[] {
  const text = getDocumentText(document);

  return findProblems(text, document.languageId as TemplateLanguage, level()).map((problem) => {
    const diagnostic = new Diagnostic(
      new Range(document.positionAt(problem.start), document.positionAt(problem.end)),
      l10n.t(problem.code, ...problem.args),
      SEVERITY,
    );

    diagnostic.source = 'MODX';

    return diagnostic;
  });
}

export default function registerDiagnostics(): Disposable {
  const collection = languages.createDiagnosticCollection('vscode-modx');
  const pending = new Map<string, ReturnType<typeof setTimeout>>();

  const forget = (uri: Uri) => {
    const key = uri.toString();
    const timer = pending.get(key);

    if (timer) {
      clearTimeout(timer);
      pending.delete(key);
    }
  };

  const refresh = (document: TextDocument) => {
    if (!LANGUAGES.has(document.languageId)) {
      return;
    }

    const problems = build(document);

    if (problems.length) {
      collection.set(document.uri, problems);
    } else {
      // Пустой список оставил бы за файлом запись в наборе; удаление убирает
      // его из панели задач совсем.
      collection.delete(document.uri);
    }
  };

  const schedule = (document: TextDocument) => {
    if (!LANGUAGES.has(document.languageId)) {
      return;
    }

    forget(document.uri);
    pending.set(document.uri.toString(), setTimeout(() => {
      pending.delete(document.uri.toString());
      refresh(document);
    }, DEBOUNCE_MS));
  };

  const refreshAll = () => workspace.textDocuments.forEach(refresh);

  refreshAll();

  return Disposable.from(
    collection,
    workspace.onDidOpenTextDocument(refresh),
    workspace.onDidChangeTextDocument(event => schedule(event.document)),
    workspace.onDidCloseTextDocument((document) => {
      forget(document.uri);
      collection.delete(document.uri);
    }),
    // Смена уровня должна быть видна сразу, а не после следующей правки.
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('vscode-modx.diagnostics')) {
        collection.clear();
        refreshAll();
      }
    }),
    new Disposable(() => pending.forEach(clearTimeout)),
  );
}
