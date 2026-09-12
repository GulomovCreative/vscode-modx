const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { loadModule } = require('./helpers');

const OPTIONS = { tabSize: 2, insertSpaces: true };

describe('Сканер шаблонов', () => {
  let scan;

  before(async () => {
    ({ scan } = await loadModule('scanner.ts'));
  });

  const kinds = (text, language) => scan(text, language).map((token) => token.kind);
  const values = (text, language, kind) =>
    scan(text, language).filter((token) => token.kind === kind).map((token) => token.value);

  test('смещения областей непрерывны и покрывают весь текст', () => {
    const text = "<p>[[*pagetitle]]</p>\n[[- прим ]]\n[[!pdoResources? &tpl=`@FILE a.tpl`]]";
    const tokens = scan(text, 'modx');

    assert.equal(tokens[0].start, 0);
    assert.equal(tokens[tokens.length - 1].end, text.length);
    for (let index = 1; index < tokens.length; index++) {
      assert.equal(tokens[index].start, tokens[index - 1].end, 'разрыв между областями');
    }
    assert.equal(tokens.map((token) => token.value).join(''), text, 'текст должен восстанавливаться');
  });

  test('вложенный тег MODX не обрывает внешний', () => {
    assert.deepEqual(
      values('<a href="[[~[[*id]]]]">x</a>', 'modx', 'modx-tag'),
      ['[[~[[*id]]]]'],
    );
  });

  test('значение в обратных кавычках может содержать скобки', () => {
    assert.deepEqual(
      values('[[!Snippet? &tpl=`[[+a]] ]] ещё`]]', 'modx', 'modx-tag'),
      ['[[!Snippet? &tpl=`[[+a]] ]] ещё`]]'],
    );
  });

  test('комментарий MODX закрывается на ближайшем ]]', () => {
    assert.deepEqual(kinds('[[- прим ]] текст', 'modx'), ['modx-comment', 'text']);
    assert.deepEqual(values('[[- прим ]] текст', 'modx', 'modx-comment'), ['[[- прим ]]']);
  });

  test('строка в кавычках не обрывает тег Fenom', () => {
    assert.deepEqual(
      values("{'a}b' | snippet}", 'fenom', 'fenom-tag'),
      ["{'a}b' | snippet}"],
    );
  });

  test('{ignore} выделяется целиком', () => {
    const text = '{ignore}.a { color: red }{/ignore}{$x}';

    assert.deepEqual(kinds(text, 'fenom'), ['fenom-ignore', 'fenom-tag']);
    assert.deepEqual(values(text, 'fenom', 'fenom-ignore'), ['{ignore}.a { color: red }{/ignore}']);
  });

  test('комментарий Fenom не разбирается как теги', () => {
    assert.deepEqual(kinds('{* {if $x} *}', 'fenom'), ['fenom-comment']);
  });

  test('незакрытая конструкция тянется до конца текста, а не дальше', () => {
    const text = '<p>{if $x}';
    const tokens = scan(text, 'fenom');

    assert.equal(tokens[tokens.length - 1].end, text.length);
  });
});

describe('Форматирование', () => {
  let format;

  before(async () => {
    ({ format } = await loadModule('formatter.ts'));
  });

  const check = (title, language, input, expected) => {
    test(title, () => {
      const actual = format(input, language, OPTIONS);

      assert.equal(actual, expected);
      assert.equal(format(actual, language, OPTIONS), actual, 'повторное форматирование меняет результат');
    });
  };

  check('вложенность Fenom и HTML', 'fenom',
    ['{if $_modx->user.id}', '<ul>', '{foreach $items as $item}', '<li>{$item.name}</li>', '{/foreach}', '</ul>', '{/if}'].join('\n'),
    ['{if $_modx->user.id}', '  <ul>', '    {foreach $items as $item}', '      <li>{$item.name}</li>', '    {/foreach}', '  </ul>', '{/if}'].join('\n'),
  );

  // Ветви {if}/{else} держат свою разметку, и она не обязана быть парной внутри
  // ветви. HTML-форматтер на этом уезжает лесенкой с накоплением.
  check('непарная разметка в ветвях не копит отступ', 'fenom',
    ['{if $wide}', '<div class="wide">', '{else}', '<div class="narrow">', '{/if}', '<p>тело</p>', '</div>'].join('\n'),
    ['{if $wide}', '  <div class="wide">', '{else}', '  <div class="narrow">', '{/if}', '<p>тело</p>', '</div>'].join('\n'),
  );

  check('многострочный вызов сниппета MODX', 'modx',
    ['<div>', '[[!pdoResources?', '&parents=`0`', '&limit=`10`', ']]', '</div>'].join('\n'),
    ['<div>', '  [[!pdoResources?', '    &parents=`0`', '    &limit=`10`', '  ]]', '</div>'].join('\n'),
  );

  check('тег в позиции атрибута не трогается', 'fenom',
    ['<div {if $active}class="on"{/if} data-id="{$id}">', '<span>x</span>', '</div>'].join('\n'),
    ['<div {if $active}class="on"{/if} data-id="{$id}">', '  <span>x</span>', '</div>'].join('\n'),
  );

  check('одиночные элементы не увеличивают уровень', 'modx',
    ['<div>', '<br>', '<img src="[[*image]]">', '<hr />', '<p>текст</p>', '</div>'].join('\n'),
    ['<div>', '  <br>', '  <img src="[[*image]]">', '  <hr />', '  <p>текст</p>', '</div>'].join('\n'),
  );

  check('парный элемент в одной строке уровень не меняет', 'modx',
    ['<div>', '<span>[[*pagetitle]]</span>', '</div>'].join('\n'),
    ['<div>', '  <span>[[*pagetitle]]</span>', '</div>'].join('\n'),
  );

  check('{switch} и {case}', 'fenom',
    ['{switch $type}', '{case 1}', '<p>раз</p>', '{case 2}', '<p>два</p>', '{/switch}'].join('\n'),
    ['{switch $type}', '  {case 1}', '    <p>раз</p>', '  {case 2}', '    <p>два</p>', '{/switch}'].join('\n'),
  );

  check('пустые строки остаются пустыми', 'modx',
    ['<div>', '   ', '<p>x</p>', '</div>'].join('\n'),
    ['<div>', '', '  <p>x</p>', '</div>'].join('\n'),
  );

  test('содержимое {ignore} не трогается', () => {
    const input = ['{if $x}', '{ignore}', '   .a { color: red }', '{/ignore}', '{/if}'].join('\n');
    const actual = format(input, 'fenom', OPTIONS);

    assert.ok(actual.includes('   .a { color: red }'), 'отступ внутри {ignore} должен сохраниться');
  });

  test('содержимое <pre> не трогается', () => {
    const input = ['<div>', '<pre>', '    сохранённый    отступ', '</pre>', '</div>'].join('\n');
    const actual = format(input, 'modx', OPTIONS);

    assert.ok(actual.includes('    сохранённый    отступ'));
  });

  test('многострочный комментарий не трогается', () => {
    const input = ['<div>', '[[- строка', '     вторая ]]', '</div>'].join('\n');
    const actual = format(input, 'modx', OPTIONS);

    assert.ok(actual.includes('     вторая ]]'), 'содержимое комментария должно остаться как есть');
  });

  test('табы вместо пробелов', () => {
    const actual = format('<div>\n<p>x</p>\n</div>', 'modx', { tabSize: 2, insertSpaces: false });

    assert.equal(actual, '<div>\n\t<p>x</p>\n</div>');
  });

  test('уже отформатированный документ не меняется', () => {
    const input = ['{if $x}', '  <div>', '    <p>{$y}</p>', '  </div>', '{/if}'].join('\n');

    assert.equal(format(input, 'fenom', OPTIONS), input);
  });

  test('текст не теряется и не добавляется', () => {
    const input = ['{if $x}', '<div class="a">', '{foreach $l as $i}', '<span>{$i}</span>', '{/foreach}', '</div>', '{/if}'].join('\n');
    const squash = (value) => value.replace(/\s+/g, ' ').trim();

    assert.equal(squash(format(input, 'fenom', OPTIONS)), squash(input));
  });
});

// F-29: объявив modx и fenom участниками HTML, расширение отдаёт их
// HTML-серверу, и тот вешает на них своё форматирование диапазона. Собственные
// провайдеры имеют приоритет и забирают и «Format Document», и «Format Selection».
describe('Провайдеры форматирования', () => {
  const { getProvider, documentWithCursor } = require('./helpers');

  test('зарегистрированы оба вида для обоих языков', async () => {
    for (const kind of ['format', 'format-range']) {
      for (const language of ['modx', 'fenom']) {
        const provider = await getProvider({ language, kind });

        assert.ok(provider, `${kind} для ${language} не зарегистрирован`);
      }
    }
  });

  test('правки отдаются построчно и только для изменившихся строк', async () => {
    const provider = await getProvider({ language: 'fenom', kind: 'format' });
    const { document } = documentWithCursor('{if $x}\n<div>‸</div>\n{/if}', 'fenom');

    const edits = provider.provideDocumentFormattingEdits(document, { tabSize: 2, insertSpaces: true });

    assert.equal(edits.length, 1, 'изменилась одна строка — правка должна быть одна');
    assert.equal(edits[0].newText, '  <div></div>');
    assert.equal(edits[0].range.start.line, 1);
  });

  test('форматирование диапазона не трогает строки вне него', async () => {
    const provider = await getProvider({ language: 'fenom', kind: 'format-range' });
    const { document } = documentWithCursor('{if $x}\n<div>\n<p>‸x</p>\n</div>\n{/if}', 'fenom');
    const { Position, Range } = require('./stubs/vscode');

    const edits = provider.provideDocumentRangeFormattingEdits(
      document,
      new Range(new Position(2, 0), new Position(2, 6)),
      { tabSize: 2, insertSpaces: true },
    );

    assert.equal(edits.length, 1);
    assert.equal(edits[0].range.start.line, 2, 'правка только для выделенной строки');
    assert.equal(edits[0].newText, '    <p>x</p>', 'отступ считается по всему документу');
  });
});
