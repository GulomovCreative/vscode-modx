const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, getProvider, complete, labels, insertText } = require('./helpers');

// F-13: границы конструкций определял getWordRangeAtPosition с регулярным
// выражением. Оно ищет только в текущей строке, а `[^}]+` внутри него не
// останавливается на `]]`, поэтому две конструкции в одной строке слипались в
// одну и курсор между ними считался «внутри тега».
describe('Границы конструкций', () => {
  describe('tokenAt', () => {
    let scan;
    let tokenAt;

    before(async () => {
      ({ scan, tokenAt } = await loadModule('scanner.ts'));
    });

    const kindAt = (text, language, offset) => tokenAt(scan(text, language), offset)?.kind;

    test('курсор внутри конструкции', () => {
      assert.equal(kindAt('[[a]]', 'modx', 3), 'modx-tag');
      assert.equal(kindAt('{$a}', 'fenom', 2), 'fenom-tag');
    });

    test('курсор перед открывающей скобкой снаружи', () => {
      assert.equal(kindAt('[[a]]', 'modx', 0), undefined);
      assert.equal(kindAt('{$a}', 'fenom', 0), undefined);
    });

    test('курсор сразу после закрывающей скобки снаружи', () => {
      assert.equal(kindAt('[[a]]', 'modx', 5), undefined);
      assert.equal(kindAt('{$a}', 'fenom', 4), undefined);
    });

    test('между двумя конструкциями в одной строке это текст, а не тег', () => {
      const text = '[[a]] x [[b]]';
      assert.equal(kindAt(text, 'modx', 6), 'text', 'пробел после первой');
      assert.equal(kindAt(text, 'modx', 7), 'text', 'сам x');
      assert.equal(kindAt(text, 'modx', 10), 'modx-tag', 'внутри второй');
    });

    test('незакрытая конструкция тянется до конца текста', () => {
      assert.equal(kindAt('[[a? &t=`x`', 'modx', 11), 'modx-tag');
      assert.equal(kindAt('{$a|', 'fenom', 4), 'fenom-tag');
    });

    test('многострочная конструкция', () => {
      assert.equal(kindAt('[[a?\n  &t=`x`\n]]', 'modx', 8), 'modx-tag');
      assert.equal(kindAt('{if $a\n  && $b}', 'fenom', 9), 'fenom-tag');
    });

    test('закрывающие скобки внутри значения не кончают конструкцию', () => {
      assert.equal(kindAt('[[a? &t=`x]]y` ]]', 'modx', 14), 'modx-tag', ']] в обратных кавычках');
      assert.equal(kindAt('{$a|default:"}" }', 'fenom', 15), 'fenom-tag', '} в кавычках');
    });

    test('комментарий конструкцией не считается', () => {
      assert.equal(kindAt('[[- note ]]', 'modx', 5), 'modx-comment');
      assert.equal(kindAt('{* note *}', 'fenom', 5), 'fenom-comment');
    });
  });

  // Тот же дефект глазами пользователя: между двумя тегами в строке подсказки
  // вели себя так, будто курсор внутри тега.
  describe('подсказки между двумя тегами в одной строке', () => {
    let setting;
    let chunk;

    before(async () => {
      setting = await getProvider({ language: 'modx', triggerCharacters: ['+'] });
      chunk = await getProvider({ language: 'modx', triggerCharacters: ['$'] });
    });

    const settingInsert = async (source) => {
      const items = await complete(setting, source, 'modx');
      const item = items.find((candidate) => candidate.label === 'site_name');

      return item && (insertText(item) ?? null);
    };

    test('настройка оборачивается в [[++ ]], как и вне тегов', async () => {
      assert.equal(await settingInsert('++site_‸'), '[[++site_name]]', 'вне тегов');
      assert.equal(await settingInsert('[[a]] ++site_‸ [[b]]'), '[[++site_name]]', 'между тегами');
      assert.equal(await settingInsert('[[++site_‸]]'), null, 'внутри тега оборачивать нечего');
    });

    test('чанк предлагается между тегами', async () => {
      assert.deepEqual(labels(await complete(chunk, '$head‸', 'modx')), ['$head'], 'вне тегов');
      assert.deepEqual(labels(await complete(chunk, '[[a]] $head‸ [[b]]', 'modx')), ['$head'], 'между тегами');
      assert.deepEqual(labels(await complete(chunk, '[[$head‸]]', 'modx')), [], 'внутри тега не предлагается');
    });
  });
});
