const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels, documentWithCursor, vscode } = require('./helpers');

const { FileType } = vscode;
const ROOT = '/project';

// F-03 и F-04: провайдер регистрируется одним экземпляром на всё расширение,
// поэтому всё, что он складывает в поля или в модульные переменные, переживает
// запрос и может утечь в следующий — в том числе в другой документ.
describe('Изоляция состояния между запросами', () => {
  describe('локальные переменные Fenom', () => {
    let variables;

    before(async () => {
      variables = await getProvider({ language: 'fenom', triggerCharacters: ['$', '>', '.', "'", '"'] });
    });

    test('переменные одного документа не попадают в подсказки другого', async () => {
      const withVar = labels(await complete(variables, '{set $onlyHere = 1}\n{$‸}', 'fenom'));
      const without = labels(await complete(variables, '{$‸}', 'fenom'));

      assert.ok(withVar.includes('$onlyHere'), 'в своём документе переменная нужна');
      assert.ok(!without.includes('$onlyHere'), 'в чужом документе её быть не должно');
    });

    test('повторный запрос не накапливает переменные', async () => {
      const first = labels(await complete(variables, '{set $repeated = 1}\n{$‸}', 'fenom'));
      const second = labels(await complete(variables, '{set $repeated = 1}\n{$‸}', 'fenom'));

      assert.deepEqual(second, first, 'списки подсказок должны совпадать');
      assert.equal(
        second.filter((name) => name === '$repeated').length,
        1,
        'переменная не должна задваиваться',
      );
    });

    test('базовый список переменных не портится локальными', async () => {
      const before_ = labels(await complete(variables, '{$‸}', 'fenom'));
      await complete(variables, '{set $temp = 1}\n{$‸}', 'fenom');
      const after = labels(await complete(variables, '{$‸}', 'fenom'));

      assert.deepEqual(after, before_, 'корневой список должен остаться прежним');
    });
  });

  describe('асинхронные провайдеры', () => {
    let files;

    beforeEach(() => {
      vscode.setWorkspace({
        files: new Map([
          [ROOT, { type: FileType.Directory, children: [['a', FileType.Directory], ['b', FileType.Directory]] }],
          [`${ROOT}/a`, { type: FileType.Directory, children: [['fromA.tpl', FileType.File]] }],
          [`${ROOT}/b`, { type: FileType.Directory, children: [['fromB.tpl', FileType.File]] }],
          [`${ROOT}/a/fromA.tpl`, { type: FileType.File, content: '' }],
          [`${ROOT}/b/fromB.tpl`, { type: FileType.File, content: '' }],
        ]),
        folder: { uri: vscode.Uri.file(ROOT), name: 'project', index: 0 },
        configuration: { 'vscode-modx': { elementsPath: '/' } },
      });
    });

    before(async () => {
      files = await getProvider({ language: 'modx', triggerCharacters: [':', '/'] });
    });

    // Два запроса в полёте одновременно: если провайдер читает разобранный
    // контекст из своего поля после await, второй запрос перезапишет его первому.
    test('одновременные запросы не перемешивают результаты', async () => {
      const a = documentWithCursor('[[$x? &tpl=`@FILE a/‸`]]', 'modx');
      const b = documentWithCursor('[[$x? &tpl=`@FILE b/‸`]]', 'modx');

      const [resultA, resultB] = await Promise.all([
        files.provideCompletionItems(a.document, a.position, {}, {}),
        files.provideCompletionItems(b.document, b.position, {}, {}),
      ]);

      assert.deepEqual(labels(resultA), ['fromA.tpl'], 'первый запрос должен видеть каталог a');
      assert.deepEqual(labels(resultB), ['fromB.tpl'], 'второй запрос должен видеть каталог b');
    });

    test('серия одновременных запросов остаётся согласованной', async () => {
      const requests = Array.from({ length: 12 }, (_item, index) => {
        const folder = index % 2 === 0 ? 'a' : 'b';
        const { document, position } = documentWithCursor(`[[$x? &tpl=\`@FILE ${folder}/‸\`]]`, 'modx');

        return files
          .provideCompletionItems(document, position, {}, {})
          .then((items) => labels(items).join(','));
      });

      const results = await Promise.all(requests);
      const expected = results.map((_item, index) => (index % 2 === 0 ? 'fromA.tpl' : 'fromB.tpl'));

      assert.deepEqual(results, expected);
    });
  });
});
