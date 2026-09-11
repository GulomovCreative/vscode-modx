const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getProvider, complete, labels, loadSource } = require('./helpers');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

describe('Схемы данных', () => {
  let modxSnippets;
  let modxProps;

  before(async () => {
    modxSnippets = await getProvider({ language: 'modx', triggerCharacters: ['[', '!'] });
    modxProps = await getProvider({ language: 'modx', triggerCharacters: ['&'] });
  });

  test('имена сниппетов уникальны', async () => {
    const names = labels(await complete(modxSnippets, '[[‸', 'modx'));
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

    assert.deepEqual([...new Set(duplicates)], []);
  });

  // F-07: redirectTo в FormIt был объявлен дважды, и обе записи попадали
  // в подсказки; через общие свойства дубль наследовался в FetchIt.
  test('у сниппета нет повторяющихся параметров', async () => {
    const snippetNames = labels(await complete(modxSnippets, '[[‸', 'modx'));
    const offenders = [];

    for (const name of snippetNames) {
      const props = labels(await complete(modxProps, `[[${name}? &‸`, 'modx'));
      const duplicates = [...new Set(props.filter((prop, index) => props.indexOf(prop) !== index))];
      if (duplicates.length) {
        offenders.push(`${name}: ${duplicates.join(', ')}`);
      }
    }

    assert.deepEqual(offenders, []);
  });

  test('FormIt и FetchIt отдают redirectTo один раз', async () => {
    for (const name of ['FormIt', 'FetchIt']) {
      const props = labels(await complete(modxProps, `[[${name}? &‸`, 'modx'));
      const count = props.filter((prop) => prop === 'redirectTo').length;

      assert.equal(count, 1, `${name}: redirectTo встречается ${count} раз`);
    }
  });
});

describe('Локализация', () => {
  const en = read('l10n/bundle.l10n.json');
  const ru = read('l10n/bundle.l10n.ru.json');

  test('наборы ключей en и ru совпадают', () => {
    const onlyEn = Object.keys(en).filter((key) => !(key in ru));
    const onlyRu = Object.keys(ru).filter((key) => !(key in en));

    assert.deepEqual(onlyEn, [], 'нет в ru');
    assert.deepEqual(onlyRu, [], 'нет в en');
  });

  test('пустых описаний нет', () => {
    const empty = Object.entries(en)
      .filter(([, value]) => typeof value === 'string' && value.trim() === '')
      .map(([key]) => key);

    assert.deepEqual(empty, []);
  });

  // Ключи описаний собираются в рантайме, например t('setting.' + name).
  // Отсутствующий ключ ничего не ломает — он отдаёт пустую подсказку, поэтому
  // проверяется, что для каждого элемента схемы ключ в бандле есть.
  describe('ключи, собираемые в рантайме', () => {
    let schemas;

    before(async () => {
      schemas = await loadSource();
    });

    const modifierKey = (mod) => (Array.isArray(mod.name) ? mod.name[0] : mod.name);

    const groups = [
      ['поля ресурса', () => schemas.resourceFields.map((n) => 'resource.' + n)],
      ['поля пользователя', () => schemas.userFields.map((n) => 'user.' + n)],
      ['поля контекста', () => schemas.contextFields.map((n) => 'context.' + n)],
      ['системные настройки', () => schemas.systemSettings.map((n) => 'setting.' + n)],
      ['массивы fastField', () => schemas.globalArrays.map((n) => 'fastfield.' + n)],
      ['префиксы fastField', () => schemas.fieldPrefixes.map((n) => 'fastfield.' + n.slice(0, -1))],
      ['модификаторы MODX', () => schemas.modxModifiers.map((m) => 'modx.modifier.' + modifierKey(m))],
      ['модификаторы Fenom', () => schemas.fenomModifiers.map((m) => 'fenom.modifier.' + modifierKey(m))],
    ];

    for (const [title, keysOf] of groups) {
      test(title, () => {
        const keys = keysOf();
        const missing = keys.filter((key) => !(key in en));

        assert.deepEqual(missing, [], `проверено ключей: ${keys.length}`);
      });
    }

    test('описания сниппетов и их параметров не пустые', () => {
      const empty = [];
      for (const snippet of schemas.snippets) {
        if (!snippet.description) {
          empty.push(snippet.name);
        }
        for (const prop of snippet.props) {
          if (!prop.description) {
            empty.push(`${snippet.name}.${prop.name}`);
          }
        }
      }

      assert.deepEqual(empty, []);
    });
  });
});
