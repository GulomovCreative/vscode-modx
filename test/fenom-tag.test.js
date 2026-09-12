const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels, insertText } = require('./helpers');

describe('Fenom: теги', () => {
  let tags;
  let close;

  before(async () => {
    tags = await getProvider({ language: 'fenom', triggerCharacters: ['{'] });
    close = await getProvider({ language: 'fenom', triggerCharacters: ['/'] });
  });

  test('в пустом шаблоне предлагаются теги верхнего уровня', async () => {
    const items = labels(await complete(tags, '{‸', 'fenom'));

    assert.ok(items.includes('if'), 'ожидался if');
    assert.ok(items.includes('foreach'), 'ожидался foreach');
    assert.ok(items.includes('block'), 'ожидался block');
  });

  test('теги ветвления не предлагаются вне родителя', async () => {
    const items = labels(await complete(tags, '{‸', 'fenom'));

    assert.ok(!items.includes('else'), 'else не должен предлагаться вне {if}');
    assert.ok(!items.includes('case'), 'case не должен предлагаться вне {switch}');
  });

  test('внутри {if} предлагается else, но не case', async () => {
    const items = labels(await complete(tags, '{if $x}\n{‸', 'fenom'));

    assert.ok(items.includes('else'), 'ожидался else');
    assert.ok(items.includes('elseif'), 'ожидался elseif');
    assert.ok(!items.includes('case'), 'case принадлежит {switch}');
  });

  test('внутри {foreach} предлагается continue', async () => {
    const items = labels(await complete(tags, '{foreach $l as $i}\n{‸', 'fenom'));

    assert.ok(items.includes('continue'), 'ожидался continue');
    assert.ok(items.includes('break'), 'ожидался break');
  });

  test('{extends} не предлагается второй раз', async () => {
    const before = labels(await complete(tags, '{‸', 'fenom'));
    const after = labels(await complete(tags, "{extends 'base.tpl'}\n{‸", 'fenom'));

    assert.ok(before.includes('extends'), 'в пустом шаблоне extends нужен');
    assert.ok(!after.includes('extends'), 'после {extends} повторно он не нужен');
  });

  // F-01: getParentTags() разворачивал стек и не возвращал обратно, если
  // закрывающий тег не нашёл пары. Ближайшим родителем становился внешний тег.
  describe('стек родительских тегов', () => {
    test('закрывающий тег предлагается для ближайшего родителя', async () => {
      const items = labels(await complete(close, "{block 'a'}{if $x}{foreach $l as $i}\n/‸", 'fenom'));

      assert.deepEqual(items, ['/foreach']);
    });

    test('непарный закрывающий тег не переворачивает стек', async () => {
      const items = labels(await complete(close, "{block 'a'}{if $x}{foreach $l as $i}{/switch}\n/‸", 'fenom'));

      assert.deepEqual(items, ['/foreach'], 'после {/switch} ближайшим родителем остаётся foreach');
    });

    test('закрытые теги уходят из стека', async () => {
      const items = labels(await complete(close, "{block 'a'}{if $x}{/if}\n/‸", 'fenom'));

      assert.deepEqual(items, ['/block']);
    });

    test('вне парного тега закрывать нечего', async () => {
      const items = labels(await complete(close, '{if $x}{/if}\n/‸', 'fenom'));

      assert.deepEqual(items, []);
    });
  });

  test('без набранной скобки тег вставляется телом со сниппетом', async () => {
    const [item] = (await complete(tags, '‸', 'fenom')).filter((entry) => entry.label === 'foreach');

    assert.match(insertText(item), /^\{foreach \$\$\{1:list\} as \$\$\{2:value\}\}/);
  });

  test('после набранной скобки вставляется только имя', async () => {
    const [item] = (await complete(tags, '{‸', 'fenom')).filter((entry) => entry.label === 'foreach');

    assert.equal(insertText(item), 'foreach', 'скобка уже набрана, дублировать её не нужно');
  });
});
