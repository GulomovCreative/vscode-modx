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
  {
    package: '@gulomov/modx-tmlanguage',
    file: 'language-configuration.json',
    target: 'languages/modx-configuration.json',
  },
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
 * В 2.0.2 пакет Fenom приезжал с CRLF. Причина была не в его репозитории: релиз
 * резался на Windows, где git конвертирует LF в CRLF при выгрузке, а npm pack
 * кладёт в архив рабочее дерево как есть. С 2.1.0 это закрыто на стороне
 * пакета, но нормализация остаётся: дефект жил в машине релиза, а не в одном
 * репозитории, и тот же сценарий возможен для любого следующего пакета.
 */
function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function version(packageName) {
  try {
    return require(`${packageName}/package.json`).version;
  } catch {
    // package.json не объявлен в exports — читаем из node_modules напрямую
  }

  try {
    return JSON.parse(fs.readFileSync(
      path.join(ROOT, 'node_modules', packageName, 'package.json'),
      'utf8',
    )).version;
  } catch {
    return undefined;
  }
}

/**
 * Версии пакетов, установленные в node_modules, по данным package-lock.json.
 *
 * Отсутствие файла или записи в нём не считается ошибкой: скрипт должен
 * работать и там, где дерево зависимостей собрано иначе.
 */
function lockedVersions() {
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
  } catch {
    return {};
  }

  const versions = {};
  for (const [location, entry] of Object.entries(lock.packages || {})) {
    if (location.startsWith('node_modules/') && entry.version) {
      versions[location.slice('node_modules/'.length)] = entry.version;
    }
  }

  return versions;
}

/**
 * Пакеты, установленная версия которых разошлась с зафиксированной.
 *
 * Проверка стоит до первой записи, потому что иначе устаревший node_modules
 * тихо откатывает грамматику: `npm run publish` после `git pull` без `npm ci`
 * переписал languages/ содержимым предыдущей версии пакета. В тот раз сборка
 * упала на следующем файле, которого в старой версии ещё не было, но совпади
 * набор файлов — и в Marketplace уехала бы подсветка на версию назад.
 */
function staleInstalls(packages, locked, installed) {
  const stale = [];

  for (const name of packages) {
    const expected = locked[name];
    const actual = installed(name);

    if (expected && actual && expected !== actual) {
      stale.push({ package: name, installed: actual, expected });
    }
  }

  return stale;
}

function main() {
  const check = process.argv.includes('--check');
  const stale = staleInstalls(
    [...new Set(SOURCES.map(source => source.package))],
    lockedVersions(),
    version,
  );

  if (stale.length) {
    for (const { package: name, installed, expected } of stale) {
      console.error(`${name}: установлена ${installed}, а package-lock.json ждёт ${expected}`);
    }
    console.error('\nnode_modules отстал от lock-файла. Запустите: npm ci');
    process.exit(1);
  }

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
}

if (require.main === module) {
  main();
}

module.exports = { lockedVersions, staleInstalls };
