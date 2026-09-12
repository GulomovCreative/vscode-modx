const { build } = require('esbuild');
const path = require('node:path');
const vscode = require('./stubs/vscode');

const { Position, Range, DEFAULT_WORD_PATTERN } = vscode;

const ROOT = path.resolve(__dirname, '..');
const STUBS = {
  vscode: path.join(__dirname, 'stubs', 'vscode.js'),
};

let activated;

// Отдельный модуль из src, собранный без стабов: для кода, который не зависит
// от vscode, — сканера, форматтера, утилит.
async function loadModule(entry) {
  const result = await build({
    entryPoints: [path.join(ROOT, 'src', entry)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
  });

  const module_ = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module_, module_.exports, require);

  return module_.exports;
}

// Расширение собирается один раз на весь прогон: esbuild подменяет vscode и
// @vscode/l10n на стабы, после чего activate() регистрирует настоящие провайдеры.
async function activate() {
  if (activated) {
    return activated;
  }

  const result = await build({
    entryPoints: [path.join(ROOT, 'src', 'extension.ts')],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    plugins: [{
      name: 'stubs',
      setup(api) {
        for (const [name, file] of Object.entries(STUBS)) {
          // external, иначе esbuild вложит стаб в бандл, и тест будет смотреть
          // на другой экземпляр, чем тот, куда провайдеры пишут регистрации.
          api.onResolve(
            { filter: new RegExp('^' + name.replace(/[/@]/g, '\\$&') + '$') },
            () => ({ path: file, external: true }),
          );
        }
      },
    }],
  });

  const module_ = { exports: {} };
  const load = new Function('module', 'exports', 'require', result.outputFiles[0].text);
  load(module_, module_.exports, require);

  await module_.exports.activate({ subscriptions: [] });
  activated = vscode.registrations;

  return activated;
}

// Провайдеры различаются по языку и набору триггеров — этого хватает, чтобы
// однозначно достать нужный, не экспортируя классы из src.
async function getProvider({ language, triggerCharacters, kind = 'completion', index = 0 }) {
  const all = await activate();
  const matches = all.filter((item) => {
    if (item.kind !== kind) {
      return false;
    }

    const selectors = Array.isArray(item.selector) ? item.selector : [item.selector];
    if (!selectors.some((selector) => selector.language === language)) {
      return false;
    }

    if (!triggerCharacters) {
      return true;
    }

    return triggerCharacters.length === item.triggerCharacters.length
      && triggerCharacters.every((char) => item.triggerCharacters.includes(char));
  });

  if (!matches[index]) {
    throw new Error(
      `провайдер не найден: language=${language} triggers=${JSON.stringify(triggerCharacters)} index=${index}`
    );
  }

  return matches[index].provider;
}

// Часть модулей нужна тестам напрямую, а не через провайдеры: схемы как данные,
// утилиты как функции. Собираются тем же esbuild с теми же стабами, чтобы это
// был ровно тот код, который попадает в расширение.
let source;

async function loadSource() {
  if (source) {
    return source;
  }

  const entry = [
    "export { default as resourceFields } from './src/schemas/resource';",
    "export { userFields } from './src/schemas/user';",
    "export { contextFields } from './src/schemas/context';",
    "export { systemSettings } from './src/schemas/settings';",
    "export { fieldPrefixes, globalArrays } from './src/schemas/fastfield';",
    "export { modxModifiers, fenomModifiers } from './src/schemas/modifiers';",
    "export { snippets } from './src/schemas/snippets/';",
    "export { inRange, toPath } from './src/utils';",
  ].join('\n');

  const result = await build({
    stdin: { contents: entry, resolveDir: ROOT, sourcefile: 'schemas.ts', loader: 'ts' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    plugins: [{
      name: 'stubs',
      setup(api) {
        for (const [name, file] of Object.entries(STUBS)) {
          api.onResolve(
            { filter: new RegExp('^' + name.replace(/[/@]/g, '\\$&') + '$') },
            () => ({ path: file, external: true }),
          );
        }
      },
    }],
  });

  const module_ = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module_, module_.exports, require);
  source = module_.exports;

  return source;
}

class TextDocument {
  constructor(text, languageId = 'modx', fsPath = '/project/core/elements/tpl/page.tpl') {
    this._lines = text.split('\n');
    this._text = text;
    this.languageId = languageId;
    // Со схемой — виртуальная рабочая область (github.dev), без неё — обычный
    // файл на диске.
    this.uri = fsPath.includes('://') ? vscode.Uri.parse(fsPath) : vscode.Uri.file(fsPath);
    this.lineCount = this._lines.length;
    // Версия растёт при каждой правке; кеш разбора документа завязан на неё.
    this.version = 1;
    this.getTextCalls = 0;
  }

  getText(range) {
    if (!range) {
      this.getTextCalls++;

      return this._text;
    }

    return this._text.slice(this.offsetAt(range.start), this.offsetAt(range.end));
  }

  lineAt(lineOrPosition) {
    const line = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;

    return { text: this._lines[line] ?? '', lineNumber: line };
  }

  offsetAt(position) {
    let offset = 0;
    for (let line = 0; line < position.line; line++) {
      offset += (this._lines[line] ?? '').length + 1;
    }

    return offset + position.character;
  }

  positionAt(offset) {
    let remaining = offset;
    for (let line = 0; line < this._lines.length; line++) {
      const length = this._lines[line].length + 1;
      if (remaining < length) {
        return new Position(line, remaining);
      }
      remaining -= length;
    }

    const last = this._lines.length - 1;

    return new Position(last, this._lines[last].length);
  }

  // Повторяет поиск слова в редакторе: среди совпадений в строке возвращается то,
  // что накрывает позицию. Без своего выражения берётся словарный шаблон VS Code.
  getWordRangeAtPosition(position, regex) {
    const text = this.lineAt(position.line).text;
    const pattern = new RegExp(
      (regex || DEFAULT_WORD_PATTERN).source,
      (regex || DEFAULT_WORD_PATTERN).flags.includes('g')
        ? (regex || DEFAULT_WORD_PATTERN).flags
        : (regex || DEFAULT_WORD_PATTERN).flags + 'g'
    );

    for (const match of text.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (start <= position.character && position.character <= end) {
        return new Range(new Position(position.line, start), new Position(position.line, end));
      }
    }

    return undefined;
  }
}

// Правка документа: новый текст и следующая версия, как это делает редактор.
function editDocument(document, text) {
  document._text = text;
  document._lines = text.split('\n');
  document.lineCount = document._lines.length;
  document.version += 1;

  return document;
}

// Курсор помечается символом ‸ — так тесты читаются как шаблон. Обычная вертикальная
// черта не годится: это оператор модификатора Fenom и разделитель значений в MODX.
const CURSOR = '\u2038';

function documentWithCursor(marked, languageId = 'modx', fsPath) {
  const offset = marked.indexOf(CURSOR);
  if (offset === -1) {
    throw new Error('в тексте нет маркера курсора ' + CURSOR);
  }
  if (marked.indexOf(CURSOR, offset + 1) !== -1) {
    throw new Error('в тексте больше одного маркера курсора ' + CURSOR);
  }

  const document = new TextDocument(marked.slice(0, offset) + marked.slice(offset + 1), languageId, fsPath);

  return { document, position: document.positionAt(offset) };
}

// Ярлык: собрать документ, вызвать провайдер и вернуть предложенные элементы.
async function complete(provider, marked, languageId, fsPath) {
  const { document, position } = documentWithCursor(marked, languageId, fsPath);
  const items = await provider.provideCompletionItems(document, position, { isCancellationRequested: false }, {});

  return items || [];
}

const labels = (items) => items.map((item) => item.label);
const insertText = (item) => (typeof item.insertText === 'string' ? item.insertText : item.insertText?.value);

module.exports = {
  CURSOR,
  TextDocument,
  activate,
  complete,
  documentWithCursor,
  editDocument,
  getProvider,
  insertText,
  labels,
  loadModule,
  loadSource,
  vscode,
};
