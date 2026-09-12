// Грамматики живут в отдельных пакетах, а contributes.grammars[].path требует
// файл внутри пакета расширения, и node_modules отсекается .vscodeignore.
// Поэтому файлы копируются в languages/ на сборке, а CI сверяет, что копии
// совпадают с установленными версиями.
//
//   node scripts/sync-grammars.js          скопировать
//   node scripts/sync-grammars.js --check   только проверить совпадение
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const SOURCES = [
  { package: 'modx-tmlanguage', file: 'modx.tmLanguage.json', target: 'languages/modx.tmLanguage.json' },
  { package: 'fenom-tmlanguage', file: 'fenom.tmLanguage.json', target: 'languages/fenom.tmLanguage.json' },
  {
    package: 'fenom-tmlanguage',
    file: 'language-configuration.json',
    target: 'languages/fenom-configuration.json',
    // Пакет начал поставлять конфигурацию языка не сразу; пока её нет,
    // используется локальная.
    optional: true,
  },
];

/**
 * Путь к файлу внутри пакета.
 *
 * Точка входа этих пакетов менялась: в опубликованных сейчас версиях экспорт
 * "." ведёт прямо в JSON, в следующих он вернётся к index.js, который отдаёт
 * путь строкой, и появятся подпути. Поддерживаются все три случая, чтобы
 * обновление пакета не ломало сборку.
 */
function resolveFile(packageName, file) {
  try {
    return require.resolve(`${packageName}/${file}`);
  } catch {
    // подпуть ещё не объявлен в exports — пробуем корневой
  }

  let main;
  try {
    main = require.resolve(packageName);
  } catch {
    return undefined;
  }

  if (main.endsWith(file)) {
    return main;
  }

  const value = require(packageName);
  if (typeof value === 'string' && value.endsWith(file)) {
    return value;
  }

  // Точка входа отдала разобранный объект вместо пути: файл лежит рядом с ней.
  const sibling = path.join(path.dirname(main), file);

  return fs.existsSync(sibling) ? sibling : undefined;
}

function version(packageName) {
  try {
    return require(`${packageName}/package.json`).version;
  } catch {
    return JSON.parse(fs.readFileSync(
      path.join(ROOT, 'node_modules', packageName, 'package.json'),
      'utf8',
    )).version;
  }
}

const check = process.argv.includes('--check');
const problems = [];
let copied = 0;

for (const source of SOURCES) {
  const from = resolveFile(source.package, source.file);
  const to = path.join(ROOT, source.target);

  if (!from) {
    if (!source.optional) {
      problems.push(`${source.package}: не найден ${source.file}`);
    } else {
      console.log(`пропущен  ${source.target}  (${source.package} пока не поставляет ${source.file})`);
    }
    continue;
  }

  const content = fs.readFileSync(from, 'utf8');
  const current = fs.existsSync(to) ? fs.readFileSync(to, 'utf8') : undefined;

  if (current === content) {
    console.log(`совпадает ${source.target}  (${source.package}@${version(source.package)})`);
    continue;
  }

  if (check) {
    problems.push(
      `${source.target} расходится с ${source.package}@${version(source.package)}`,
    );
    continue;
  }

  fs.writeFileSync(to, content);
  copied++;
  console.log(`обновлён  ${source.target}  (${source.package}@${version(source.package)})`);
}

if (problems.length) {
  console.error('\n' + problems.join('\n'));
  if (check) {
    console.error('\nЗапустите: npm run sync-grammars');
  }
  process.exit(1);
}

if (!check && copied === 0) {
  console.log('\nвсё уже синхронно');
}
