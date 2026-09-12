const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels, documentWithCursor, vscode } = require('./helpers');

const ROOT = '/project';
const { FileType } = vscode;

// Дерево проекта, которое видит стаб workspace.fs.
function tree(elementsPath) {
  const files = new Map([
    [ROOT, { type: FileType.Directory, children: [['core', FileType.Directory]] }],
    [`${ROOT}/core`, { type: FileType.Directory, children: [['elements', FileType.Directory]] }],
    [`${ROOT}/core/elements`, {
      type: FileType.Directory,
      children: [
        ['chunks', FileType.Directory],
        ['snippets', FileType.Directory],
        ['base.tpl', FileType.File],
        ['.hidden.tpl', FileType.File],
        ['readme.md', FileType.File],
      ],
    }],
    [`${ROOT}/core/elements/chunks`, {
      type: FileType.Directory,
      children: [['item.tpl', FileType.File], ['card.html', FileType.File]],
    }],
    [`${ROOT}/core/elements/snippets`, {
      type: FileType.Directory,
      children: [['getData.php', FileType.File], ['notes.txt', FileType.File]],
    }],
    [`${ROOT}/core/elements/base.tpl`, { type: FileType.File, content: "{block 'header'}{/block}" }],
    [`${ROOT}/core/elements/.hidden.tpl`, { type: FileType.File, content: '' }],
    [`${ROOT}/core/elements/readme.md`, { type: FileType.File, content: '' }],
    [`${ROOT}/core/elements/chunks/item.tpl`, { type: FileType.File, content: '' }],
    [`${ROOT}/core/elements/chunks/card.html`, { type: FileType.File, content: '' }],
    [`${ROOT}/core/elements/snippets/getData.php`, { type: FileType.File, content: '' }],
    [`${ROOT}/core/elements/snippets/notes.txt`, { type: FileType.File, content: '' }],
  ]);

  return {
    files,
    folder: { uri: vscode.Uri.file(ROOT), name: 'project', index: 0 },
    configuration: { 'vscode-modx': { elementsPath } },
  };
}

describe('@FILE: пути к файлам', () => {
  let completion;
  let definition;

  before(async () => {
    completion = await getProvider({ language: 'modx', triggerCharacters: [':', '/'] });
    definition = await getProvider({ language: 'modx', kind: 'definition' });
  });

  beforeEach(() => vscode.setWorkspace(tree('/core/elements/')));

  test('в корне elements предлагаются шаблоны и каталоги', async () => {
    const items = labels(await complete(completion, '[[$chunk? &tpl=`@FILE ‸`]]', 'modx'));

    assert.ok(items.includes('base.tpl'), 'ожидался base.tpl');
    assert.ok(items.includes('chunks'), 'ожидался каталог chunks');
  });

  test('файлы с посторонним расширением отсеиваются', async () => {
    const items = labels(await complete(completion, '[[$chunk? &tpl=`@FILE ‸`]]', 'modx'));

    assert.ok(!items.includes('readme.md'), 'md не является шаблоном');
  });

  test('скрытые файлы не предлагаются', async () => {
    const items = labels(await complete(completion, '[[$chunk? &tpl=`@FILE ‸`]]', 'modx'));

    assert.ok(!items.includes('.hidden.tpl'), 'файлы с точки скрыты');
  });

  test('вложенный каталог раскрывается', async () => {
    const items = labels(await complete(completion, '[[$chunk? &tpl=`@FILE chunks/‸`]]', 'modx'));

    assert.deepEqual(items.sort(), ['card.html', 'item.tpl']);
  });

  test('каталог вставляется со слэшем и просит новые подсказки', async () => {
    const [folder] = (await complete(completion, '[[$chunk? &tpl=`@FILE ‸`]]', 'modx'))
      .filter((item) => item.label === 'chunks');

    assert.equal(folder.insertText, 'chunks/');
    assert.equal(folder.command?.command, 'editor.action.triggerSuggest');
  });

  test('elementsPath = / берёт файлы от корня проекта', async () => {
    vscode.setWorkspace(tree('/'));
    const items = labels(await complete(completion, '[[$chunk? &tpl=`@FILE ‸`]]', 'modx'));

    assert.deepEqual(items, ['core'], 'от корня проекта виден только каталог core');
  });

  test('пустой elementsPath равнозначен корню проекта', async () => {
    vscode.setWorkspace(tree(''));
    const items = labels(await complete(completion, '[[$chunk? &tpl=`@FILE ‸`]]', 'modx'));

    assert.deepEqual(items, ['core']);
  });

  describe('переход к файлу', () => {
    test('ведёт на путь внутри elementsPath', () => {
      const { document, position } = documentWithCursor('[[$chunk? &tpl=`@FILE chunks/item.tpl‸`]]', 'modx');
      const [link] = definition.provideDefinition(document, position);

      assert.equal(link.targetUri.fsPath, `${ROOT}/core/elements/chunks/item.tpl`);
    });

    test('вне биндинга перехода нет', () => {
      const { document, position } = documentWithCursor('<div>просто текст‸</div>', 'modx');

      assert.deepEqual(definition.provideDefinition(document, position), []);
    });
  });
});

// F-08: выражение применялось без флага g, а позиция пути вычислялась через
// lastIndexOf, поэтому при двух биндингах в строке подсказки брались от первого,
// а диапазон — от последнего совпадения подстроки.
describe('@FILE: несколько биндингов в одной строке', () => {
  let completion;
  let definition;

  before(async () => {
    completion = await getProvider({ language: 'modx', triggerCharacters: [':', '/'] });
    definition = await getProvider({ language: 'modx', kind: 'definition' });
  });

  beforeEach(() => vscode.setWorkspace(tree('/core/elements/')));

  test('подсказки берутся от того биндинга, где стоит курсор', async () => {
    const first = labels(await complete(
      completion,
      '[[$x? &tpl=`@FILE ‸` &tplWrapper=`@FILE snippets/`]]',
      'modx',
    ));
    const second = labels(await complete(
      completion,
      '[[$x? &tpl=`@FILE chunks/` &tplWrapper=`@FILE ‸`]]',
      'modx',
    ));

    assert.ok(first.includes('base.tpl'), 'первый биндинг: корень elements');
    assert.deepEqual(second.sort(), ['base.tpl', 'chunks', 'snippets'], 'второй биндинг: тоже корень');
  });

  test('во втором биндинге раскрывается его собственный каталог', async () => {
    const items = labels(await complete(
      completion,
      '[[$x? &tpl=`@FILE base.tpl` &tplWrapper=`@FILE chunks/‸`]]',
      'modx',
    ));

    assert.deepEqual(items.sort(), ['card.html', 'item.tpl']);
  });

  test('переход ведёт к файлу того биндинга, где стоит курсор', () => {
    const { document, position } = documentWithCursor(
      '[[$x? &tpl=`@FILE base.tpl` &tplWrapper=`@FILE chunks/item.tpl‸`]]',
      'modx',
    );
    const [link] = definition.provideDefinition(document, position);

    assert.equal(link.targetUri.fsPath, `${ROOT}/core/elements/chunks/item.tpl`);
  });

  test('вне пути биндинга подсказок нет', async () => {
    const items = labels(await complete(
      completion,
      '[[$x? &tpl=`@FILE base.tpl` &limit=`‸10`]]',
      'modx',
    ));

    assert.deepEqual(items, []);
  });
});

// #20: схема бралась из Uri.file(), то есть всегда file:. В виртуальной рабочей
// области — github.dev, vscode.dev без клона — файлы лежат под vscode-vfs:, и
// провайдер искал их на несуществующем диске.
describe('@FILE: виртуальная рабочая область', () => {
  const VFS = 'vscode-vfs://github/GulomovCreative/site';
  let files;
  let definition;

  before(async () => {
    files = await getProvider({ language: 'modx', triggerCharacters: [':', '/'] });
    definition = await getProvider({ language: 'modx', kind: 'definition' });
  });

  beforeEach(() => {
    vscode.setWorkspace({
      files: new Map([
        [`${VFS}/core/elements`, {
          type: FileType.Directory,
          children: [['chunks', FileType.Directory], ['base.tpl', FileType.File]],
        }],
        [`${VFS}/core/elements/chunks`, {
          type: FileType.Directory,
          children: [['item.tpl', FileType.File]],
        }],
        [`${VFS}/core/elements/base.tpl`, { type: FileType.File, content: '' }],
        [`${VFS}/core/elements/chunks/item.tpl`, { type: FileType.File, content: '' }],
      ]),
      folder: { uri: vscode.Uri.parse(VFS), name: 'site', index: 0 },
      configuration: { 'vscode-modx': { elementsPath: '/core/elements/' } },
    });
  });

  const document = `${VFS}/core/elements/tpl/page.tpl`;

  test('подсказки находят файлы по схеме рабочей области', async () => {
    const items = await complete(files, '[[$x? &tpl=`@FILE ‸`]]', 'modx', document);

    assert.deepEqual(labels(items), ['chunks', 'base.tpl']);
  });

  test('вложенный каталог раскрывается так же', async () => {
    const items = await complete(files, '[[$x? &tpl=`@FILE chunks/‸`]]', 'modx', document);

    assert.deepEqual(labels(items), ['item.tpl']);
  });

  test('переход к файлу сохраняет схему, а не подставляет file:', () => {
    const { document: source, position } = documentWithCursor(
      '[[$x? &tpl=`@FILE chunks/it‸em.tpl`]]',
      'modx',
      document,
    );

    const [ link ] = definition.provideDefinition(source, position);

    assert.equal(link.targetUri.scheme, 'vscode-vfs');
    assert.equal(link.targetUri.toString(), `${VFS}/core/elements/chunks/item.tpl`);
  });
});
