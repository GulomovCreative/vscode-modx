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
  { package: '@gulomov/modx-tmlanguage', file: 'modx.tmLanguage.json', target: 'languages/modx.tmLanguage.json' },
  { package: '@gulomov/fenom-tmlanguage', file: 'fenom.tmLanguage.json', target: 'languages/fenom.tmLanguage.json' },
  // Конфигурацию языка поставляет только пакет Fenom; у MODX она своя и
  // лежит в languages/modx-configuration.json.
  {
    package: '@gulomov/fenom-tmlanguage',
    file: 'language-configuration.json',
    target: 'languages/fenom-configuration.json',
  },
];

/**
 * Путь к файлу внутри пакета.
 *
 * Пакеты объявляют подпути в exports, поэтому обычно срабатывает первая
 * попытка. Запасные пути оставлены намеренно: точка входа этих пакетов уже
 * менялась — экспорт "." вёл то прямо в JSON, то в index.js, отдающий путь
 * строкой, — и обновление грамматики не должно ломать сборку.
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

/**
 * Переводы строк приводятся к LF.
 *
 * Пакеты собираются на разных машинах и часть файлов приходит с CRLF, а на
 * Windows git может ещё раз переписать окончания при выгрузке. Без этого
 * `--check` в CI падал бы на файлах, которые отличаются только переводом
 * строки.
 */
function normalize(text) {
  return text.replace(/\r\n/g, '\n');
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
    problems.push(`${source.package}: не найден ${source.file}`);
    continue;
  }

  const content = normalize(fs.readFileSync(from, 'utf8'));
  const current = fs.existsSync(to) ? normalize(fs.readFileSync(to, 'utf8')) : undefined;

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
