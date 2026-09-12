// Минимальная реализация API VS Code, достаточная для провайдеров автодополнения.
//
// Тесты вызывают настоящие провайдеры, поэтому поведение классов должно совпадать
// с редактором там, где провайдеры на него опираются: арифметика Position, поиск
// слова под курсором и перевод позиции в смещение.

// Словарный шаблон редактора строится из USUAL_WORD_SEPARATORS
// (src/vs/editor/common/core/wordHelper.ts). Набор разделителей важен: от того,
// что $ # + * — не часть слова, зависит разбор контекста во всех провайдерах.
const USUAL_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';

const DEFAULT_WORD_PATTERN = new RegExp(
  '(-?\\d*\\.\\d\\w*)|([^' + [...USUAL_WORD_SEPARATORS].map((c) => '\\' + c).join('') + '\\s]+)',
  'g',
);

class Position {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }

  translate(delta = {}) {
    const { lineDelta = 0, characterDelta = 0 } =
      typeof delta === 'number' ? { lineDelta: delta } : delta;

    return new Position(this.line + lineDelta, this.character + characterDelta);
  }

  with(change = {}) {
    const { line = this.line, character = this.character } = change;

    return new Position(line, character);
  }

  isBefore(other) {
    return this.line < other.line || (this.line === other.line && this.character < other.character);
  }
}

class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  with(change = {}) {
    const { start = this.start, end = this.end } = change;

    return new Range(start, end);
  }
}

class MarkdownString {
  constructor(value = '') {
    this.value = value;
  }

  appendMarkdown(value) {
    this.value += value;
    return this;
  }

  appendCodeblock(code, language = '') {
    this.value += '\n```' + language + '\n' + code + '\n```\n';
    return this;
  }
}

class SnippetString {
  constructor(value = '') {
    this.value = value;
  }
}

class CompletionItem {
  constructor(label, kind) {
    this.label = label;
    this.kind = kind;
  }
}

// Настоящие значения перечисления не важны — важно, что они различимы и читаемы
// в сообщениях об ошибках.
const CompletionItemKind = new Proxy({}, { get: (_target, name) => String(name) });
const CompletionItemTag = { Deprecated: 1 };
const FileType = { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 };

// Провайдеры регистрируются при вызове activate(); стаб их запоминает, чтобы
// тесты могли достать нужный и дёрнуть напрямую.
const registrations = [];

const languages = {
  registerCompletionItemProvider(selector, provider, ...triggerCharacters) {
    registrations.push({ kind: 'completion', selector, provider, triggerCharacters });
    return { dispose() {} };
  },
  registerDefinitionProvider(selector, provider) {
    registrations.push({ kind: 'definition', selector, provider, triggerCharacters: [] });
    return { dispose() {} };
  },
};

// Настройки и файловая система подменяются из теста через setWorkspace().
let workspaceState = { configuration: {}, folder: undefined, files: new Map() };

function setWorkspace(state) {
  workspaceState = { configuration: {}, folder: undefined, files: new Map(), ...state };
}

const workspace = {
  getConfiguration(section) {
    const values = workspaceState.configuration[section] || {};
    return { get: (key) => values[key] };
  },
  getWorkspaceFolder() {
    return workspaceState.folder;
  },
  fs: {
    async readDirectory(uri) {
      const entry = workspaceState.files.get(uri.fsPath);
      if (!entry || entry.type !== FileType.Directory) {
        throw new Error('ENOENT: ' + uri.fsPath);
      }
      return entry.children;
    },
    async stat(uri) {
      const entry = workspaceState.files.get(uri.fsPath);
      if (!entry) {
        throw new Error('ENOENT: ' + uri.fsPath);
      }
      return { type: entry.type, ctime: 0, mtime: 0, size: 0 };
    },
    async readFile(uri) {
      const entry = workspaceState.files.get(uri.fsPath);
      if (!entry || entry.type !== FileType.File) {
        throw new Error('ENOENT: ' + uri.fsPath);
      }
      return Buffer.from(entry.content ?? '', 'utf8');
    },
  },
};

const Uri = {
  // Редактор нормализует путь, поэтому /a/b/ и /a/b — один и тот же ресурс.
  // Без этого стаб расходится с реальностью: getPath() отдаёт путь с хвостовым
  // слэшем, и поиск по точному совпадению не находил бы каталог.
  file(fsPath) {
    const normalized = fsPath.length > 1 ? fsPath.replace(/[/\\]+$/, '') || '/' : fsPath;

    return {
      scheme: 'file',
      fsPath: normalized,
      path: normalized,
      toString: () => 'file://' + normalized,
    };
  },
};

const env = { language: 'en' };

const window = {
  createOutputChannel() {
    return { appendLine() {}, dispose() {} };
  },
};

const extensions = {
  getExtension() {
    return { activate: async () => {} };
  },
};

module.exports = {
  CompletionItem,
  CompletionItemKind,
  CompletionItemTag,
  FileType,
  MarkdownString,
  Position,
  Range,
  SnippetString,
  Uri,
  env,
  extensions,
  languages,
  window,
  workspace,

  // служебное, не часть API VS Code
  DEFAULT_WORD_PATTERN,
  registrations,
  setWorkspace,
};
