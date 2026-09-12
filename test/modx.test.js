const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels, insertText } = require('./helpers');

describe('MODX: теги', () => {
  let placeholder;
  let setting;
  let fastField;
  let snippet;
  let snippetProps;
  let modifier;

  before(async () => {
    placeholder = await getProvider({ language: 'modx', triggerCharacters: ['*', '+'] });
    setting = await getProvider({ language: 'modx', triggerCharacters: ['+'] });
    fastField = await getProvider({ language: 'modx', triggerCharacters: ['#', '.'] });
    snippet = await getProvider({ language: 'modx', triggerCharacters: ['[', '!'] });
    snippetProps = await getProvider({ language: 'modx', triggerCharacters: ['&'] });
    modifier = await getProvider({ language: 'modx', triggerCharacters: [':'] });
  });

  const find = (items, label) => items.find((item) => item.label === label);

  describe('плейсхолдеры и поля ресурса', () => {
    test('после [[* предлагаются поля ресурса', async () => {
      const items = labels(await complete(placeholder, '[[*‸', 'modx'));

      assert.ok(items.includes('pagetitle'), 'ожидалось pagetitle');
      assert.ok(items.includes('longtitle'), 'ожидалось longtitle');
    });

    test('после [[+ добавляются поля пользователя', async () => {
      const items = labels(await complete(placeholder, '[[+‸', 'modx'));

      assert.ok(items.includes('modx.user.id'), 'ожидалось modx.user.id');
    });

    test('вне скобок тег вставляется целиком', async () => {
      const item = find(await complete(placeholder, '<div>*‸', 'modx'), 'pagetitle');

      assert.equal(insertText(item), '[[*pagetitle]]', 'скобок в тексте нет, их надо дописать');
    });

    test('внутри скобок скобки не дублируются', async () => {
      const item = find(await complete(placeholder, '[[*‸]]', 'modx'), 'pagetitle');

      assert.equal(insertText(item), undefined, 'вставляется сам label, скобки уже есть');
    });
  });

  describe('системные настройки', () => {
    test('после [[++ предлагаются настройки', async () => {
      const items = labels(await complete(setting, '[[++‸', 'modx'));

      assert.ok(items.includes('site_url'), 'ожидалось site_url');
      assert.ok(items.includes('friendly_urls'), 'ожидалось friendly_urls');
    });

    test('одиночный + настройки не предлагает', async () => {
      const items = labels(await complete(setting, '[[+‸', 'modx'));

      assert.deepEqual(items, [], 'один плюс — это плейсхолдер, а не настройка');
    });
  });

  describe('теги fastField', () => {
    test('после # предлагаются суперглобальные массивы', async () => {
      const items = labels(await complete(fastField, '[[#‸', 'modx'));

      assert.ok(items.includes('GET'), 'ожидался GET');
      assert.ok(items.includes('SESSION'), 'ожидался SESSION');
    });

    test('после #15. предлагаются поля ресурса и префиксы', async () => {
      const items = labels(await complete(fastField, '[[#15.‸', 'modx'));

      assert.ok(items.includes('pagetitle'), 'ожидалось поле ресурса');
      assert.ok(items.includes('tv.'), 'ожидался префикс tv.');
    });
  });

  describe('сниппеты', () => {
    test('после [[ предлагаются сниппеты', async () => {
      const items = labels(await complete(snippet, '[[‸', 'modx'));

      assert.ok(items.includes('pdoResources'), 'ожидался pdoResources');
      assert.ok(items.includes('msProducts'), 'ожидался msProducts');
    });

    test('после & предлагаются параметры вызванного сниппета', async () => {
      const items = labels(await complete(snippetProps, '[[pdoResources? &‸', 'modx'));

      assert.ok(items.includes('parents'), 'ожидался parents');
      assert.ok(items.includes('tpl'), 'ожидался tpl');
    });

    test('уже введённые параметры не повторяются', async () => {
      const items = labels(await complete(snippetProps, '[[pdoResources? &parents=`0` &‸', 'modx'));

      assert.ok(items.length > 0, 'ожидались оставшиеся параметры');
      assert.ok(!items.includes('parents'), 'parents уже введён');
    });
  });

  describe('модификаторы вывода', () => {
    test('после : предлагаются модификаторы', async () => {
      const items = labels(await complete(modifier, '[[*pagetitle:‸', 'modx'));

      assert.ok(items.includes('ellipsis'), 'ожидался ellipsis');
      assert.ok(items.includes('date'), 'ожидался date');
    });

    test('внутри незакрытой обратной кавычки модификаторы не предлагаются', async () => {
      const items = labels(await complete(modifier, '[[*pagetitle:default=`a:‸', 'modx'));

      assert.deepEqual(items, [], 'двоеточие внутри значения не открывает модификатор');
    });
  });
});
