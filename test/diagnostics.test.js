const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadModule, activate, documentWithCursor, vscode } = require('./helpers');

// #50. Проверка не синтаксиса, а структуры: конструкция без конца и непарные
// теги. Всё, что требует знания Fenom на сервере, сюда не входит.
describe('Диагностика шаблона', () => {
  let findProblems;

  before(async () => {
    ({ findProblems } = await loadModule('diagnostics.ts'));
  });

  const codes = (text, language = 'fenom', level = 'unclosed') =>
    findProblems(text, language, level).map((problem) => problem.code.replace('diagnostic.', ''));

  describe('незакрытые конструкции', () => {
    const cases = [
      ['{ без }', '{$a', 'fenom', 'unclosedFenomTag'],
      ['{* без *}', '{* note', 'fenom', 'unclosedFenomComment'],
      ['{ignore} без {/ignore}', '{ignore}css', 'fenom', 'unclosedFenomIgnore'],
      ['[[ без ]]', '[[!pdo? &a=', 'modx', 'unclosedModxTag'],
      ['[[- без ]]', '[[- note', 'modx', 'unclosedModxComment'],
      ['обратная кавычка без пары', '[[$x? &tpl=`abc]]', 'modx', 'unclosedModxTag'],
      ['вложенный тег без внешнего ]]', '[[a [[b]]', 'modx', 'unclosedModxTag'],
    ];

    for (const [title, text, language, expected] of cases) {
      test(title, () => assert.deepEqual(codes(text, language), [expected]));
    }

    test('подчёркивается только открывающая скобка', () => {
      const [ problem ] = findProblems('<p>x</p>\n{if $a\nещё строка', 'fenom', 'unclosed');

      assert.equal(problem.end - problem.start, 1, 'длина должна быть равна "{"');
    });
  });

  describe('парность блоков Fenom', () => {
    test('{if} без {/if}', () => assert.deepEqual(codes('{if $a}\ntext'), ['unclosedBlock']));
    test('лишний {/if}', () => assert.deepEqual(codes('text\n{/if}'), ['unexpectedClosing']));
    test('{/foreach} закрывает {if}', () => assert.deepEqual(codes('{if $a}\n{/foreach}'), ['mismatchedClosing']));
    test('{else} вне {if}', () => assert.deepEqual(codes('<p>{else}</p>'), ['middleOutsideBlock']));
    test('{case} вне {switch}', () => assert.deepEqual(codes('{if $a}{case 1}{/if}'), ['middleOutsideBlock']));

    test('сообщение называет оба тега', () => {
      const [ problem ] = findProblems('{if $a}\n{/foreach}', 'fenom', 'unclosed');

      assert.deepEqual(problem.args, ['foreach', 'if']);
    });

    const quiet = [
      ['целый шаблон', "{extends 'a'}\n{block 'b'}\n{if $a}x{/if}\n{/block}"],
      ['{else} внутри {if}', '{if $a}x{else}y{/if}'],
      ['{foreachelse} внутри {foreach}', '{foreach $a as $b}x{foreachelse}y{/foreach}'],
      ['{case} и {default} внутри {switch}', '{switch $a}{case 1}x{default}y{/switch}'],
      ['{set} с присваиванием — инструкция', '{set $x = 1}\n<p>y</p>'],
      ['{var} с присваиванием — инструкция', '{var $x = 1}'],
      ['{var} без присваивания — блок, и он закрыт', '{var $x}text{/var}'],
      ['инлайновый CSS: {filter: …} не тег Fenom', '<style>.a{filter: blur(2px)}\n.b{color:red}</style>'],
      ['инлайновый JS', '<script>function f() { return 1 }</script>'],
      ['MODX не знает блочных тегов', '[[*pagetitle]] [[- прим ]] [[$chunk]]'],
    ];

    for (const [title, text] of quiet) {
      test(title + ' — молчит', () => assert.deepEqual(codes(text, text.startsWith('[[') ? 'modx' : 'fenom'), []));
    }
  });

  describe('парность HTML — только на уровне all', () => {
    test('пропущенный </div> находится', () =>
      assert.deepEqual(codes('<div>\n<p>x</p>', 'fenom', 'all'), ['unclosedElement']));

    test('на уровне unclosed не проверяется', () =>
      assert.deepEqual(codes('<div>\n<p>x</p>', 'fenom', 'unclosed'), []));

    test('</p> закрывает <div>', () =>
      assert.deepEqual(codes('<div>\n</p>', 'fenom', 'all'), ['mismatchedClosingElement']));

    test('лишний закрывающий', () =>
      assert.deepEqual(codes('<p>x</p>\n</div>', 'fenom', 'all'), ['unexpectedClosingElement']));

    const quiet = [
      ['одиночные элементы', '<div><img src="x"><br><input type="text" /></div>'],
      ['тег внутри комментария HTML', '<!-- <div> -->\n<p>x</p>'],
      ['тег внутри {ignore}', '{ignore}<div>{/ignore}\n<p>x</p>'],
      ['сравнение в JavaScript', '<script>if (a < b) { c() }</script>\n<p>x</p>'],
      ['тег внутри конструкции шаблона', "{include 'a' html='<div>'}\n<p>x</p>"],
      ['многострочный тег', '<div\nclass="x"\n>\ntext\n</div>'],
    ];

    for (const [title, text] of quiet) {
      test(title + ' — молчит', () => assert.deepEqual(codes(text, 'fenom', 'all'), []));
    }
  });

  test('off выключает всё', () =>
    assert.deepEqual(codes('<div>\n{if $a}\n{*', 'fenom', 'off'), []));

  test('проблемы отсортированы по положению в тексте', () => {
    const problems = findProblems('{if $a}\n{* note\n{foreach $b as $c}', 'fenom', 'unclosed');

    assert.ok(problems.length > 1, 'ожидается несколько проблем');
    for (let index = 1; index < problems.length; index++) {
      assert.ok(problems[index].start >= problems[index - 1].start, 'порядок нарушен');
    }
  });
});

// Проверка обвязки: что activate() действительно подписывается на документы.
describe('Диагностика: подключение к редактору', () => {
  beforeEach(async () => {
    await activate();
    vscode.diagnostics.clear();
    vscode.setWorkspace({ configuration: { 'vscode-modx': { diagnostics: 'unclosed' } } });
  });

  test('набор диагностик создаётся при активации', async () => {
    const all = await activate();

    assert.ok(all.some((item) => item.kind === 'diagnostics'), 'createDiagnosticCollection не вызван');
  });

  test('открытие документа с ошибкой выставляет диагностику', () => {
    const { document } = documentWithCursor('{if $a}‸\ntext', 'fenom');

    vscode.events.didOpen.fire(document);

    const items = vscode.diagnostics.get(document.uri.toString());
    assert.equal(items?.length, 1, 'ожидалась одна диагностика');
    assert.equal(items[0].severity, vscode.DiagnosticSeverity.Warning, 'предупреждение, а не ошибка');
    assert.equal(items[0].source, 'MODX');
  });

  // Та же регрессия, что и в описаниях подсказок: сообщение собиралось вызовом
  // с ключом, и на английском интерфейсе в панель Problems попадал сам ключ —
  // «diagnostic.unclosedBlock», ещё и без подставленного имени тега.
  test('сообщение — текст с подставленным именем тега', () => {
    const { document } = documentWithCursor('{if $a}‸\ntext', 'fenom');

    vscode.events.didOpen.fire(document);

    const items = vscode.diagnostics.get(document.uri.toString());

    assert.equal(items[0].message, 'Tag if is never closed.');
  });

  test('целый шаблон диагностик не оставляет', () => {
    const { document } = documentWithCursor('{if $a}x{/if}‸', 'fenom');

    vscode.events.didOpen.fire(document);

    assert.equal(vscode.diagnostics.has(document.uri.toString()), false);
  });

  test('закрытие документа убирает диагностику', () => {
    const { document } = documentWithCursor('{if $a}‸', 'fenom');

    vscode.events.didOpen.fire(document);
    assert.equal(vscode.diagnostics.has(document.uri.toString()), true);

    vscode.events.didClose.fire(document);
    assert.equal(vscode.diagnostics.has(document.uri.toString()), false);
  });

  test('чужой язык не трогается', () => {
    const { document } = documentWithCursor('{if $a}‸', 'html');

    vscode.events.didOpen.fire(document);

    assert.equal(vscode.diagnostics.has(document.uri.toString()), false);
  });
});
