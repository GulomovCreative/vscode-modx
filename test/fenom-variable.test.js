const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { getProvider, complete, labels, insertText } = require('./helpers');

describe('Fenom: переменные', () => {
  let variables;

  before(async () => {
    variables = await getProvider({ language: 'fenom', triggerCharacters: ['$', '>', '.', "'", '"'] });
  });

  const find = (items, label) => items.find((item) => item.label === label);

  test('после $ предлагаются корневые переменные', async () => {
    const items = labels(await complete(variables, '{$‸}', 'fenom'));

    assert.ok(items.includes('$_modx'), 'ожидался $_modx');
    assert.ok(items.includes('$'), 'ожидалась $ для системных переменных Fenom');
  });

  test('$_modx-> раскрывает поля и методы', async () => {
    const items = labels(await complete(variables, '{$_modx->‸}', 'fenom'));

    assert.ok(items.includes('resource'), 'ожидалось поле resource');
    assert.ok(items.includes('user'), 'ожидалось поле user');
    assert.ok(items.includes('runSnippet'), 'ожидался метод runSnippet');
  });

  test('$_modx->resource. раскрывает поля ресурса', async () => {
    const items = labels(await complete(variables, '{$_modx->resource.‸}', 'fenom'));

    assert.ok(items.includes('pagetitle'), 'ожидалось pagetitle');
    assert.ok(items.includes('id'), 'ожидалось id');
  });

  test('локальные переменные из {set} попадают в подсказки', async () => {
    const items = labels(await complete(variables, '{set $myVar = 1}\n{$‸}', 'fenom'));

    assert.ok(items.includes('$myVar'), 'ожидалась объявленная переменная');
  });

  test('{unset} убирает переменную из подсказок', async () => {
    const items = labels(await complete(variables, '{set $tmpVar = 1}\n{unset $tmpVar}\n{$‸}', 'fenom'));

    assert.ok(!items.includes('$tmpVar'), 'переменная снята через {unset}');
  });

  test('переменные {foreach} видны внутри цикла', async () => {
    const items = labels(await complete(variables, '{foreach $list as $item}\n{$‸}', 'fenom'));

    assert.ok(items.includes('$item'), 'ожидалась переменная итерации');
  });

  // Зафиксировано текущее поведение, а не желаемое: разбор объявлений опирается
  // на [a-zA-Z_] и \w, поэтому имена вне ASCII не распознаются. PHP и Fenom их
  // допускают, так что при переходе на общий сканер это стоит пересмотреть.
  test('имена переменных вне ASCII пока не распознаются', async () => {
    const items = labels(await complete(variables, '{set $моя = 1}\n{$‸}', 'fenom'));

    assert.ok(!items.includes('$моя'), 'если тест упал — поддержка не-ASCII появилась, ограничение снято');
  });

  // F-05: плейсхолдеры аргументов нумеровались с нуля, а $0 в синтаксисе
  // сниппетов VS Code — финальная позиция курсора, а не первая остановка.
  describe('порядок табуляции в сниппетах методов', () => {
    const cases = [
      ['getChunk', /getChunk\('\$\{1:chunkName\}'\)/],
      ['makeUrl', /makeUrl\(\$\{1:id\}\)/],
      ['toPlaceholder', /toPlaceholder\('\$\{1:key\}', \$\{2:value\}\)/],
    ];

    for (const [name, expected] of cases) {
      test(name, async () => {
        const item = find(await complete(variables, '{$_modx->‸}', 'fenom'), name);

        assert.ok(item, 'метод ' + name + ' не предложен');
        assert.match(insertText(item), expected);
      });
    }

    test('ни один аргумент не получает $0', async () => {
      const items = await complete(variables, '{$_modx->‸}', 'fenom');
      const withZero = items
        .map((item) => [item.label, insertText(item)])
        .filter(([, text]) => typeof text === 'string' && /\$\{0:/.test(text));

      assert.deepEqual(withZero, [], '$0 — финальная позиция курсора, аргументом быть не может');
    });

    test('аргументы со значением по умолчанию в сниппет не попадают', async () => {
      const item = find(await complete(variables, '{$_modx->‸}', 'fenom'), 'getChunk');

      assert.ok(!insertText(item).includes('properties'), 'у properties есть значение по умолчанию');
      assert.ok(!insertText(item).includes('fastMode'), 'у fastMode есть значение по умолчанию');
    });

    test('метод без обязательных аргументов вставляется с пустыми скобками', async () => {
      const item = find(await complete(variables, '{$_modx->‸}', 'fenom'), 'getPlaceholders');

      assert.equal(insertText(item), 'getPlaceholders()');
    });
  });
});
