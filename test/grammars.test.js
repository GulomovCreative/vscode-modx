const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

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
