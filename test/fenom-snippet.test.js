const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels } = require('./helpers');

describe('Fenom: сниппеты и их параметры', () => {
  let props;

  before(async () => {
    props = await getProvider({ language: 'fenom', triggerCharacters: ["'", '"'] });
  });

  // F-02: в шаблоне вызова был потерян квантификатор, из-за чего распознавалось
  // только односимвольное имя сниппета, и подсказки параметров не появлялись.
  describe('параметры внутри $_modx->runSnippet()', () => {
    const cases = [
      ["{$_modx->runSnippet('pdoResources', ['‸']}", 'обычное имя'],
      ['{$_modx->runSnippet("pdoResources", ["‸"]}', 'двойные кавычки'],
      ["{$_modx->runSnippet('!pdoResources', ['‸']}", 'некешируемый вызов'],
      ["{$_modx->runSnippet('pdoMenu', ['‸']}", 'другой сниппет'],
    ];

    for (const [template, title] of cases) {
      test(title, async () => {
        const items = labels(await complete(props, template, 'fenom'));

        assert.ok(items.length > 0, 'ожидались подсказки параметров, получено 0');
        assert.ok(items.includes('parents'), 'ожидался параметр parents, получено: ' + items.slice(0, 5));
      });
    }
  });

  test('параметры предлагаются и в форме с модификатором snippet', async () => {
    const items = labels(await complete(props, "{'pdoResources' | snippet : ['‸']}", 'fenom'));

    assert.ok(items.includes('parents'), 'ожидался параметр parents');
  });

  test('уже введённые параметры не предлагаются повторно', async () => {
    const items = labels(await complete(
      props,
      "{$_modx->runSnippet('pdoResources', ['parents' => 0, '‸']}",
      'fenom',
    ));

    assert.ok(items.length > 0, 'ожидались оставшиеся параметры');
    assert.ok(!items.includes('parents'), 'parents уже введён');
  });

  test('у незнакомого сниппета параметров нет', async () => {
    const items = labels(await complete(props, "{$_modx->runSnippet('НетТакого', ['‸']}", 'fenom'));

    assert.deepEqual(items, []);
  });

  test('имена сниппетов предлагаются в модификаторе', async () => {
    const modifier = await getProvider({ language: 'fenom', triggerCharacters: ["'", '"', '!'], index: 0 });
    const items = labels(await complete(modifier, "{'‸'}", 'fenom'));

    assert.ok(items.includes('pdoResources'), 'ожидался pdoResources');
    assert.ok(items.includes('FormIt'), 'ожидался FormIt');
  });
});
