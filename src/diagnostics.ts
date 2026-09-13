// Поиск структурных ошибок в шаблоне.
//
// Не проверка синтаксиса: правильность выражения внутри {if} знает только Fenom
// на сервере, а шаблон MODX — это HTML с вкраплениями, а не язык с грамматикой.
// Здесь только то, что видно из разбора и что человек глазами ищет дольше
// всего: конструкция, у которой нет конца, и непарные теги.
//
// Модуль не зависит от vscode: он возвращает смещения и коды сообщений, а
// диапазоны и перевод делает провайдер.

import { scan, type TemplateLanguage, type Token, type TokenKind } from './scanner';
import { BRANCH_OWNER, MIDDLE_TAGS, opensBlock, parseTagName } from './fenom';
import { HTML_TAG, isSelfContained, stripComments } from './html';

export type DiagnosticLevel = 'off' | 'unclosed' | 'all';

export interface TemplateProblem {
  start: number
  end: number
  /** Ключ сообщения в бандле локализации. */
  code: string
  /** Подстановки для {0}, {1} в сообщении. */
  args: string[]
}

/** Чем открывается область и как назвать её незакрытой. */
const UNCLOSED: Partial<Record<TokenKind, { opening: string, code: string }>> = {
  'modx-tag': { opening: '[[', code: 'diagnostic.unclosedModxTag' },
  'modx-comment': { opening: '[[-', code: 'diagnostic.unclosedModxComment' },
  'fenom-tag': { opening: '{', code: 'diagnostic.unclosedFenomTag' },
  'fenom-comment': { opening: '{*', code: 'diagnostic.unclosedFenomComment' },
  'fenom-ignore': { opening: '{ignore}', code: 'diagnostic.unclosedFenomIgnore' },
};

/**
 * Область, оборвавшаяся концом текста.
 *
 * Подчёркивается только открывающая скобка: сама область тянется до конца
 * файла, и подчёркивать весь остаток бессмысленно.
 */
function unclosedRegions(tokens: Token[]): TemplateProblem[] {
  const problems: TemplateProblem[] = [];

  for (const token of tokens) {
    const rule = token.unterminated ? UNCLOSED[token.kind] : undefined;

    if (rule) {
      problems.push({
        start: token.start,
        end: token.start + rule.opening.length,
        code: rule.code,
        args: [],
      });
    }
  }

  return problems;
}

/** Парность блочных тегов Fenom. */
function fenomBlocks(tokens: Token[]): TemplateProblem[] {
  const problems: TemplateProblem[] = [];
  const open: Array<{ name: string, start: number, end: number }> = [];

  for (const token of tokens) {
    if (token.kind !== 'fenom-tag' || token.unterminated) {
      continue;
    }

    const parsed = parseTagName(token.value);
    if (!parsed) {
      continue;
    }

    const { closing, name, rest } = parsed;
    const range = { start: token.start, end: token.end };

    if (closing) {
      // У {case} и {default} закрывающего тега нет. Если он всё же написан,
      // это ошибка в шаблоне, но снимать им со стека чужой блок нельзя —
      // тогда посыплется вся остальная разметка.
      if (!opensBlock(name, '')) {
        continue;
      }

      const last = open.at(-1);

      if (!last) {
        problems.push({ ...range, code: 'diagnostic.unexpectedClosing', args: [name] });
        continue;
      }

      if (last.name !== name) {
        problems.push({ ...range, code: 'diagnostic.mismatchedClosing', args: [name, last.name] });
      }

      open.pop();
      continue;
    }

    if (MIDDLE_TAGS.has(name)) {
      const owners = BRANCH_OWNER[name] ?? [];
      const last = open.at(-1);

      if (!last || !owners.includes(last.name)) {
        problems.push({ ...range, code: 'diagnostic.middleOutsideBlock', args: [name, owners.join(', ')] });
      }

      continue;
    }

    if (opensBlock(name, rest)) {
      open.push({ name, ...range });
    }
  }

  for (const tag of open) {
    problems.push({ start: tag.start, end: tag.end, code: 'diagnostic.unclosedBlock', args: [tag.name] });
  }

  return problems;
}

/**
 * Парность тегов HTML.
 *
 * Включается отдельно и не по умолчанию: в шаблоне разметка законно бывает
 * непарной — разнесённой по ветвям {if} или по разным чанкам, — и отличить
 * фрагмент от целой страницы расширение не может.
 */
function htmlElements(text: string, tokens: Token[]): TemplateProblem[] {
  const problems: TemplateProblem[] = [];
  const open: Array<{ name: string, start: number, end: number }> = [];

  // Конструкции шаблона гасятся, чтобы разметка внутри них не считалась.
  const stripped = stripComments(
    tokens.map(token => (token.kind === 'text' ? token.value : ' '.repeat(token.value.length))).join(''),
  );

  for (const match of stripped.matchAll(HTML_TAG)) {
    const [ whole, slash, rawName, attributes = '' ] = match;
    const name = rawName.toLowerCase();

    if (isSelfContained(name, attributes)) {
      continue;
    }

    const start = match.index ?? 0;
    const range = { start, end: start + whole.length };

    if (!slash) {
      open.push({ name, ...range });
      continue;
    }

    const last = open.at(-1);

    if (!last) {
      problems.push({ ...range, code: 'diagnostic.unexpectedClosingElement', args: [name] });
      continue;
    }

    if (last.name !== name) {
      problems.push({ ...range, code: 'diagnostic.mismatchedClosingElement', args: [name, last.name] });
    }

    open.pop();
  }

  for (const element of open) {
    problems.push({
      start: element.start,
      end: element.end,
      code: 'diagnostic.unclosedElement',
      args: [element.name],
    });
  }

  return problems;
}

export function findProblems(
  text: string,
  language: TemplateLanguage,
  level: DiagnosticLevel,
): TemplateProblem[] {
  if (level === 'off') {
    return [];
  }

  const tokens = scan(text, language);
  const problems = [
    ...unclosedRegions(tokens),
    ...(language === 'fenom' ? fenomBlocks(tokens) : []),
    ...(level === 'all' ? htmlElements(text, tokens) : []),
  ];

  return problems.sort((first, second) => first.start - second.start);
}
