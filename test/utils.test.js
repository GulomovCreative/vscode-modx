const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers');

// Обе функции заменяют lodash, который весил 57% бандла ради них двоих.
// Ожидаемые значения взяты сравнением с lodash до его удаления.
describe('utils', () => {
  let inRange;
  let toPath;

  before(async () => {
    ({ inRange, toPath } = await loadSource());
  });

  describe('toPath', () => {
    const cases = [
      ['$_modx', ['$_modx']],
      ['$', ['$']],
      ['$.tpl.name', ['$', 'tpl', 'name']],
      ['$_modx.resource.pagetitle', ['$_modx', 'resource', 'pagetitle']],
      ['resource.pagetitle', ['resource', 'pagetitle']],
      ['a[0]', ['a', '0']],
      ['a[0].b', ['a', '0', 'b']],
      ["a['b']", ['a', 'b']],
      ['a["b"]', ['a', 'b']],
      ["a['b'].c[0]", ['a', 'b', 'c', '0']],
      ["a['b.c']", ['a', 'b.c']],
      ["a['b\\'c']", ['a', "b'c"]],
      ['a[-1]', ['a', '-1']],
      ['a[1.5]', ['a', '1.5']],
      ['', []],
      ['.leading', ['', 'leading']],
      ['trailing.', ['trailing', '']],
      ['a..b', ['a', '', 'b']],
      ['a[].b', ['a', '', 'b']],
      ['$_modx->resource', ['$_modx->resource']],
    ];

    for (const [input, expected] of cases) {
      test(JSON.stringify(input), () => {
        assert.deepEqual(toPath(input), expected);
      });
    }
  });

  describe('inRange', () => {
    const cases = [
      [[5, 0, 10], true, 'внутри интервала'],
      [[0, 0, 10], true, 'нижняя граница включается'],
      [[10, 0, 10], false, 'верхняя граница не включается'],
      [[-1, 0, 10], false, 'левее интервала'],
      [[3, 10, 0], true, 'перевёрнутые границы переставляются'],
      [[5, 8], true, 'с одним аргументом интервал считается от нуля'],
      [[9, 8], false, 'за пределами интервала от нуля'],
      [[-2, -5, 0], true, 'отрицательные границы'],
    ];

    for (const [args, expected, title] of cases) {
      test(title, () => {
        assert.equal(inRange(...args), expected, `inRange(${args})`);
      });
    }
  });
});
