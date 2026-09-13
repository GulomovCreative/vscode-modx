const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { lockedVersions, staleInstalls } = require('../scripts/sync-grammars.js');

// Грамматики поддерживаются отдельными пакетами, а в languages/ лежат копии:
// contributes.grammars[].path требует файл внутри пакета расширения, а
// node_modules отсекается .vscodeignore. Копия, отставшая от пакета, означает,
// что исправления подсветки до пользователей не доезжают.
describe('Грамматики', () => {
  test('копии в languages/ совпадают с установленными пакетами', () => {
    try {
      execFileSync('node', [path.join(ROOT, 'scripts', 'sync-grammars.js'), '--check'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      assert.fail(
        'копии разошлись с пакетами, запустите npm run sync-grammars\n\n'
        + (error.stdout || '') + (error.stderr || ''),
      );
    }
  });

  for (const file of ['modx.tmLanguage.json', 'fenom.tmLanguage.json']) {
    test(file + ' — валидный JSON с scopeName', () => {
      const grammar = JSON.parse(fs.readFileSync(path.join(ROOT, 'languages', file), 'utf8'));

      assert.ok(grammar.scopeName, 'у грамматики должен быть scopeName');
      assert.ok(grammar.patterns || grammar.injections, 'грамматика должна что-то описывать');
    });
  }

  test('scopeName совпадает с тем, что заявлено в манифесте', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

    for (const contributed of manifest.contributes.grammars) {
      const grammar = JSON.parse(fs.readFileSync(path.join(ROOT, contributed.path), 'utf8'));

      assert.equal(grammar.scopeName, contributed.scopeName, contributed.path);
    }
  });
});

// Скрипт копирует в languages/ то, что лежит в node_modules, поэтому отставший
// node_modules откатывает грамматику назад. Так и случилось: `npm run publish`
// после `git pull` без `npm ci` переписал копию содержимым предыдущей версии
// пакета. Спасло только то, что нужного файла в той версии ещё не было — при
// совпадении набора файлов в Marketplace уехала бы подсветка на версию назад.
describe('Отставший node_modules', () => {
  const installed = versions => name => versions[name];

  test('расхождение с lock-файлом останавливает синхронизацию', () => {
    const stale = staleInstalls(
      ['@gulomov/modx-tmlanguage'],
      { '@gulomov/modx-tmlanguage': '2.1.0' },
      installed({ '@gulomov/modx-tmlanguage': '2.0.0' }),
    );

    assert.deepEqual(stale, [
      { package: '@gulomov/modx-tmlanguage', installed: '2.0.0', expected: '2.1.0' },
    ]);
  });

  test('совпадающая версия проходит молча', () => {
    const stale = staleInstalls(
      ['@gulomov/modx-tmlanguage', '@gulomov/fenom-tmlanguage'],
      { '@gulomov/modx-tmlanguage': '2.1.0', '@gulomov/fenom-tmlanguage': '2.1.0' },
      installed({ '@gulomov/modx-tmlanguage': '2.1.0', '@gulomov/fenom-tmlanguage': '2.1.0' }),
    );

    assert.deepEqual(stale, []);
  });

  // Дерево зависимостей бывает собрано и без package-lock.json — например,
  // через npm link при работе над самой грамматикой. Это не повод падать.
  test('неизвестная версия не считается расхождением', () => {
    assert.deepEqual(staleInstalls(['нет-в-локе'], {}, installed({ 'нет-в-локе': '1.0.0' })), []);
    assert.deepEqual(staleInstalls(['не-стоит'], { 'не-стоит': '1.0.0' }, installed({})), []);
  });

  test('версии читаются из package-lock.json без префикса node_modules/', () => {
    const locked = lockedVersions();

    for (const name of ['@gulomov/modx-tmlanguage', '@gulomov/fenom-tmlanguage']) {
      const manifest = path.join(ROOT, 'node_modules', name, 'package.json');

      assert.equal(locked[name], JSON.parse(fs.readFileSync(manifest, 'utf8')).version, name);
    }
  });
});
