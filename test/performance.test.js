const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels, documentWithCursor, editDocument, vscode } = require('./helpers');

const { FileType } = vscode;
const ROOT = '/project';

describe('Производительность', () => {
  describe('разбор документа кешируется до правки', () => {
    let providers;

    before(async () => {
      providers = await Promise.all([
        getProvider({ language: 'fenom', triggerCharacters: ['{'] }),
        getProvider({ language: 'fenom', triggerCharacters: ['|'] }),
        getProvider({ language: 'fenom', triggerCharacters: ['$', '>', '.', "'", '"'] }),
      ]);
    });

    // Провайдеры вызываются на каждое нажатие клавиши, и каждый перечитывал
    // документ целиком. Кеш живёт до следующей правки документа.
    test('несколько провайдеров на один ввод читают текст один раз', async () => {
      const { document, position } = documentWithCursor('{foreach $list as $item}\n{$‸}', 'fenom');
      document.getTextCalls = 0;

      for (const provider of providers) {
        await provider.provideCompletionItems(document, position, {}, {});
      }

      assert.equal(document.getTextCalls, 1, `текст прочитан ${document.getTextCalls} раз вместо одного`);
    });

    test('правка документа сбрасывает кеш', async () => {
      const { document, position } = documentWithCursor('{set $first = 1}\n{$‸}', 'fenom');
      const variables = providers[2];

      const before_ = labels(await variables.provideCompletionItems(document, position, {}, {}));
      assert.ok(before_.includes('$first'), 'исходная переменная должна быть видна');

      editDocument(document, '{set $second = 1}\n{$}');
      const after = labels(await variables.provideCompletionItems(document, position, {}, {}));

      assert.ok(after.includes('$second'), 'после правки видна новая переменная');
      assert.ok(!after.includes('$first'), 'старая переменная должна уйти');
    });

    test('повторный запрос без правки не перечитывает текст', async () => {
      const { document, position } = documentWithCursor('{$‸}', 'fenom');
      const variables = providers[2];

      await variables.provideCompletionItems(document, position, {}, {});
      document.getTextCalls = 0;
      await variables.provideCompletionItems(document, position, {}, {});

      assert.equal(document.getTextCalls, 0, 'документ не менялся, читать его заново незачем');
    });
  });

  describe('отмена запроса', () => {
    let files;
    let blocks;

    before(async () => {
      files = await getProvider({ language: 'modx', triggerCharacters: [':', '/'] });
      blocks = await getProvider({ language: 'fenom', triggerCharacters: ["'", '"', '.'] });
    });

    beforeEach(() => {
      vscode.setWorkspace({
        files: new Map([
          [ROOT, { type: FileType.Directory, children: [['base.tpl', FileType.File], ['page.tpl', FileType.File]] }],
          [`${ROOT}/base.tpl`, { type: FileType.File, content: "{block 'header'}{/block}" }],
          [`${ROOT}/page.tpl`, { type: FileType.File, content: "{extends 'base.tpl'}" }],
        ]),
        folder: { uri: vscode.Uri.file(ROOT), name: 'project', index: 0 },
        configuration: { 'vscode-modx': { elementsPath: '/' } },
      });
    });

    const cancelled = { isCancellationRequested: true };

    test('обход каталогов прекращается по отмене', async () => {
      const { document, position } = documentWithCursor('[[$x? &tpl=`@FILE ‸`]]', 'modx');
      const items = await files.provideCompletionItems(document, position, cancelled, {});

      assert.deepEqual(labels(items), []);
    });

    test('обход шаблонов прекращается по отмене', async () => {
      const { document, position } = documentWithCursor(
        "{extends 'base.tpl'}\n{paste '‸'}",
        'fenom',
        `${ROOT}/page.tpl`,
      );
      const items = await blocks.provideCompletionItems(document, position, cancelled, {});

      assert.deepEqual(labels(items), []);
    });

    test('без отмены имена блоков родителя собираются', async () => {
      const { document, position } = documentWithCursor(
        "{extends 'base.tpl'}\n{paste '‸'}",
        'fenom',
        `${ROOT}/page.tpl`,
      );
      const items = await blocks.provideCompletionItems(document, position, { isCancellationRequested: false }, {});

      assert.ok(labels(items).includes('header'), 'ожидалось имя блока из родительского шаблона');
    });
  });
});
