const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getProvider, complete } = require('./helpers');

const ROOT = path.resolve(__dirname, '..');
const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, 'l10n', 'bundle.l10n.json'), 'utf8'));

const text = (item) => {
  const documentation = item.documentation;

  return typeof documentation === 'string' ? documentation : documentation?.value;
};

// Описания хранятся под ключами вроде FetchIt.description, а не английским
// текстом. Для vscode.l10n ключ — это и есть сообщение: он ищет перевод в
// bundle.l10n.<язык>.json, а не найдя, возвращает аргумент. Для английского
// интерфейса бандл не загружается вообще, поэтому в подсказке оказывался сам
// ключ: «FetchIt.description» вместо описания и «reference» вместо «More
// information». Уехало в 1.2.0 и держалось до 1.3.0.
//
// Стаб l10n.t в тестах возвращает ключ ровно так же, как это делает VS Code
// на английском, — поэтому здесь проверяется именно английская ветка.
describe('Английские описания', () => {
  const providers = {};

  before(async () => {
    const configurations = {
      'сниппеты': { language: 'modx', triggerCharacters: ['[', '!'] },
      'параметры сниппетов': { language: 'modx', triggerCharacters: ['&'] },
      'системные настройки': { language: 'modx', triggerCharacters: ['+'] },
      'поля ресурса': { language: 'modx', triggerCharacters: ['*', '+'] },
      'быстрые поля': { language: 'modx', triggerCharacters: ['#', '.'] },
      'модификаторы': { language: 'modx', triggerCharacters: [':'] },
      'теги Fenom': { language: 'fenom', triggerCharacters: ['{'] },
    };

    for (const [name, configuration] of Object.entries(configurations)) {
      providers[name] = await getProvider(configuration);
    }
  });

  test('описание сниппета — текст, а не ключ', async () => {
    const items = await complete(providers['сниппеты'], '[[‸', 'modx');
    const fetchIt = items.find((item) => (item.label.label ?? item.label) === 'FetchIt');

    assert.ok(fetchIt, 'FetchIt не предложен');
    assert.match(text(fetchIt), /^An lightweight Extra for processing forms using the Fetch API\./);
  });

  test('ссылка подписана словами', async () => {
    const items = await complete(providers['сниппеты'], '[[‸', 'modx');
    const documented = items.filter((item) => text(item)?.includes(']('));

    assert.ok(documented.length, 'ни одной подсказки со ссылкой');

    for (const item of documented) {
      assert.match(text(item), /\[More information\]\(/, item.label.label ?? item.label);
    }
  });

  // Ключи в подсказках не поймать точечной проверкой: их 963, и описание
  // каждого элемента собирается своим вызовом. Поэтому проверяется свойство —
  // ни один показанный текст не должен быть ключом бандла.
  test('ни одно описание не совпадает с ключом бандла', async () => {
    const inputs = {
      'сниппеты': '[[‸',
      'параметры сниппетов': '[[pdoResources? &‸',
      'системные настройки': '[[++‸',
      'поля ресурса': '[[*‸',
      'быстрые поля': '[[#1.‸',
      'модификаторы': '[[*id:‸',
      'теги Fenom': '{‸',
    };
    const offenders = [];

    for (const [name, input] of Object.entries(inputs)) {
      const language = name === 'теги Fenom' ? 'fenom' : 'modx';

      for (const item of await complete(providers[name], input, language)) {
        for (const line of (text(item) ?? '').split('\n')) {
          const label = line.replace(/^\[(.*)\]\(.*\)$/, '$1').trim();

          if (label && label in bundle) {
            offenders.push(`${name}: ${item.label.label ?? item.label} — ${label}`);
          }
        }
      }
    }

    assert.deepEqual(offenders, []);
  });
});
