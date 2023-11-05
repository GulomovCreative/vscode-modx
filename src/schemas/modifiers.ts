import { env } from 'vscode';

export interface Modifier {
  name: string | string[]
  body?: string
  placeholder?: string | boolean
  link?: string
  example?: string
  detail?: string
}

const DOCUMENTATION_URL = 'https://docs.modx.pro/system/basics/modifiers/';

export const modxModifiers: Modifier[] = [
  {
    name: ['if', 'input'],
    link: 'conditional#if',
    example: '[[*id:is=`1`:and:if=`[[*id]]`:ne=`2`:then=`Yes`:else=`No`]]',
    placeholder: true,
  },
  {
    name: 'or',
    body: 'or:',
    link: 'conditional#or',
    example: '[[+numbooks:is=`5`:or:is=`6`:then=`There are 5 or 6 books!`:else=`Not sure how many books`]]',
  },
  {
    name: 'and',
    body: 'and:',
    link: 'conditional#and',
    example: '[[*numbooks:is=`1`:and:if=`[[*id]]`:ne=`2`:then=`Yes`:else=`No`]]',
  },
  {
    name: ['isequalto', 'isequal', 'equalto', 'equals', 'is', 'eq'],
    link: 'conditional#is',
    example: '[[+numbooks:isequalto=`5`:then=`There are 5 books!`:else=`Not sure how many books`]]',
    placeholder: true,
  },
  {
    name: ['notequalto', 'notequals', 'isnt', 'isnot', 'neq', 'ne'],
    link: 'conditional#isnot',
    example: '[[+numbooks:notequalto=`5`:then=`Not sure how many books`:else=`There are 5 books!`]]',
    placeholder: true,
  },
  {
    name: ['greaterthanorequalto', 'equalorgreaterthen', 'ge', 'eg', 'isgte', 'gte'],
    link: 'conditional#eq',
    example: '[[+numbooks:gte=`5`:then=`There are 5 books or more than 5 books`:else=`There are less than 5 books`]]',
    placeholder: true,
  },
  {
    name: ['isgreaterthan', 'greaterthan', 'isgt', 'gt'],
    link: 'conditional#gt',
    example: '[[+numbooks:gt=`5`:then=`There are more than 5 books`:else=`There are less than 5 books`]]',
    placeholder: true,
  },
  {
    name: ['equaltoorlessthan', 'lessthanorequalto', 'el', 'le', 'islte', 'lte'],
    link: 'conditional#el',
    example: '[[+numbooks:lte=`5`:then=`There are 5 or less than 5 books`:else=`There are more than 5 books`]]',
    placeholder: true,
  },
  {
    name: ['islowerthan', 'islessthan', 'lowerthan', 'lessthan', 'islt', 'lt'],
    link: 'conditional#lt',
    example: '[[+numbooks:lt=`5`:then=`There are less than 5 books`:else=`There are more than 5 books`]]',
    placeholder: true,
  },
  {
    name: 'contains',
    link: 'conditional#and',
    placeholder: true,
  },
  {
    name: 'containsnot',
    link: 'conditional#and',
    placeholder: true,
  },
  {
    name: ['in', 'IN', 'inarray', 'inArray'],
    link: 'conditional#and',
    placeholder: true,
  },
  {
    name: 'hide',
    link: 'conditional#hide',
    example: '[[+numbooks:lt=`1`:hide]]',
  },
  {
    name: 'show',
    link: 'conditional#show',
    example: '[[+numbooks:gt=`0`:show]]',
  },
  {
    name: 'then',
    link: 'conditional#then',
    example: '[[+numbooks:gt=`0`:then=`Now available!`]]',
    placeholder: true,
  },
  {
    name: 'else',
    link: 'conditional#else',
    example: '[[+numbooks:gt=`0`:then=`Now available!`:else=`Sorry, currently sold out.`]]',
    placeholder: true,
  },
  {
    name: 'select',
    placeholder: true,
  },
  {
    name: ['memberof', 'ismember', 'mo'],
    link: 'conditional#memberof',
    example: '[[!+modx.user.id:memberof=`Administrator`]]',
    placeholder: true,
  },
  {
    name: 'cat',
    link: 'string#cat',
    example: '[[+numbooks:cat=`books`]]',
    placeholder: true,
  },
  {
    name: ['after', 'append'],
    placeholder: true,
  },
  {
    name: ['before', 'prepend'],
    placeholder: true,
  },
  {
    name: ['lcase', 'lowercase', 'strtolower'],
    link: 'string#lcase',
    example: '[[+title:lcase]]',
  },
  {
    name: ['ucase', 'uppercase', 'strtoupper'],
    link: 'string#ucase',
    example: '[[+headline:ucase]]',
  },
  {
    name: 'ucwords',
    link: 'string#ucwords',
    example: '[[+title:ucwords]]',
  },
  {
    name: 'ucfirst',
    link: 'string#ucfirst',
    example: '[[+name:ucfirst]]',
  },
  {
    name: ['htmlent', 'htmlentities'],
    link: 'string#htmlent',
    example: '[[+email:htmlent]]',
  },
  {
    name: ['esc', 'escape'],
    link: 'string#esc',
    example: '[[+email:escape]]',
  },
  {
    name: 'strip',
    link: 'string#strip',
    example: '[[+textdocument:strip]]',
  },
  {
    name: 'stripString',
    link: 'string#stripstring',
    example: '[[+name:stripString=`Mr.`]]',
    placeholder: true,
  },
  {
    name: 'replace',
    body: 'replace=`${1:search}==${2:replace}`',
    link: 'string#replace',
    example: '[[+pagetitle:replace=`Mr.==Mrs.`]]',
  },
  {
    name: ['striptags', 'stripTags', 'notags', 'strip_tags'],
    link: 'string#notags',
    example: '[[+code:strip_tags]]',
    placeholder: 'allowed',
  },
  {
    name: 'stripmodxtags',
  },
  {
    name: ['len', 'length', 'strlen'],
    link: 'string#strlen',
    example: '[[+longstring:strlen]]',
  },
  {
    name: ['reverse', 'strrev'],
    link: 'string#reverse',
    example: '[[+mirrortext:reverse]]',
  },
  {
    name: 'wordwrap',
    link: 'string#wordwrap',
    example: '[[+bodytext:wordwrap=`80`]]',
    placeholder: 'amount',
  },
  {
    name: 'wordwrapcut',
    link: 'string#wordwrapcut',
    example: '[[+bodytext:wordwrapcut=`80`]]',
    placeholder: 'amount',
  },
  {
    name: 'limit',
    link: 'string#limit',
    example: '[[+description:limit=`50`]]',
    placeholder: 'amount',
  },
  {
    name: 'ellipsis',
    link: 'string#ellipsis',
    example: '[[+description:ellipsis=`50`]]',
    placeholder: 'amount',
  },
  {
    name: 'tag',
    link: 'string#tag',
    example: '[[+showThis:tag]]',
  },
  {
    name: 'tvLabel',
  },
  {
    name: ['add', 'increment', 'incr'],
    link: 'string#add',
    example: '[[+downloads:incr]] [[+blackjack:add=`21`]]',
    placeholder: 'amount',
  },
  {
    name: ['subtract', 'decrement', 'decr'],
    link: 'string#decr',
    example: '[[+countdown:decr]] [[+moneys:subtract=`100`]]',
    placeholder: 'amount',
  },
  {
    name: ['multiply', 'mpy'],
    link: 'string#mpy',
    example: '[[+trifecta:mpy=`3`]]',
    placeholder: 'amount',
  },
  {
    name: ['divide', 'div'],
    link: 'string#div',
    example: '[[+rating:div=`4`]]',
    placeholder: 'amount',
  },
  {
    name: ['modulus', 'mod'],
    link: 'string#mod',
    example: '[[+number:mod]]',
    placeholder: 'amount',
  },
  {
    name: ['ifempty', 'default', 'empty', 'isempty'],
    link: 'string#default',
    example: '[[+name:default=`anonymous`]]',
    placeholder: true,
  },
  {
    name: ['notempty', '!empty', 'ifnotempty', 'isnotempty'],
    link: 'string#notempty',
    example: '[[+name:notempty=`Hello [[+name]]!`]]',
    placeholder: true,
  },
  {
    name: 'nl2br',
    link: 'string#nl2br',
    example: '[[+textfile:nl2br]]',
  },
  {
    name: 'date',
    link: 'string#date',
    example: '[[+birthyear:date=`%Y`]]',
    placeholder: 'format',
  },
  {
    name: 'strtotime',
    link: 'string#strtotime',
    example: '[[+thetime:strtotime]]',
  },
  {
    name: 'fuzzydate',
    link: 'string#fuzzydate',
    example: '[[+createdon:fuzzydate]]',
  },
  {
    name: 'ago',
    link: 'string#ago',
    example: '[[+createdon:ago]]',
  },
  {
    name: 'md5',
    link: 'string#md5',
    example: '[[+password:md5]]',
  },
  {
    name: 'cdata',
    link: 'string#cdata',
    example: '[[+content:cdata]]',
  },
  {
    name: 'userinfo',
    link: 'string#userinfo',
    example: '[[!+modx.user.id:userinfo=`username`]]',
    placeholder: 'field',
  },
  {
    name: 'isloggedin',
    link: 'string#isloggedin',
    example: '[[!+modx.user.id:isloggedin:is=`1`:then=`Yes`:else=`No`]]',
  },
  {
    name: 'isnotloggedin',
    link: 'string#isnotloggedin',
    example: '[[!+modx.user.id:isnotloggedin:is=`1`:then=`No`:else=`Yes`]]',
  },
  {
    name: 'toPlaceholder',
    placeholder: 'name',
  },
  {
    name: 'cssToHead',
  },
  {
    name: 'htmlToHead',
  },
  {
    name: 'htmlToBottom',
  },
  {
    name: 'jsToHead',
  },
  {
    name: 'jsToBottom',
  },
  {
    name: 'urlencode',
    link: 'string#urlencode',
    example: '[[+mystring:urlencode]]',
  },
  {
    name: 'urldecode',
    link: 'string#urldecode',
    example: '[[+myparam:urldecode]]',
  },
  {
    name: 'filterPathSegment',
  }
].map(mod => {
  if (mod.link) {
    mod.link = DOCUMENTATION_URL + mod.link;
  }

  return mod;
});

export const fenomBuiltinModifiers: Modifier[] = [
  {
    name: ['upper', 'up', 'ucase', 'uppercase', 'strtoupper'],
    detail: '{$name | {name}}',
  },
  {
    name: ['lower', 'low', 'lcase', 'lowercase', 'strtolower'],
    detail: '{$name | {name}}',
  },
  {
    name: 'date_format',
    detail: "{$date | date_format : $format = '%b %e, %Y'}",
  },
  {
    name: 'date',
  },
  {
    name: ['truncate', 'ellipsis'],
    detail: "{$long_string | {name} : $length : $etc = '...' : $by_words = false : $middle = false}",
  },
  {
    name: ['escape', 'e'],
    detail: "{$text | {name} : $type = 'html' : $charset = 'UTF8'}",
  },
  {
    name: 'unescape',
    detail: "{$text | unescape : $type = 'html'}",
  },
  {
    name: 'strip',
    detail: "{$string | strip}",
  },
  {
    name: ['length', 'len', 'strlen'],
    detail: "{$string | {name}}",
  },
  {
    name: 'in',
    detail: "{$number | in : $array}",
  },
  {
    name: 'match',
    detail: "{$string | match : $pattern}",
  },
  {
    name: 'ematch',
    detail: "{$string | ematch : $pattern}",
  },
  {
    name: 'replace',
    detail: "{$string | replace : $search : $replace}",
  },
  {
    name: 'ereplace',
    detail: "{$string | ereplace : $pattern : $replacement}",
  },
  {
    name: 'split',
    detail: "{$string | split : $delimiter = ','}",
  },
  {
    name: 'esplit',
    detail: "{$string | esplit : $pattern = '/,\\s*/'}",
  },
  {
    name: 'join',
    detail: "{$array | join : $delimiter = ','}",
  },
].map(mod => ({
  ...mod,
  link: `https://github.com/fenom-template/fenom/blob/master/docs/${env.language || 'en'}/mods/${Array.isArray(mod.name) ? mod.name[0] : mod.name}.md`
}));

export const fenomModifiers: Modifier[] = [
  ...fenomBuiltinModifiers,
  {
    name: 'iterable',
    detail: "{$array | iterable} => bool",
  },
  {
    name: ['number', 'number_format'],
    detail: "{$number | {name} : $decimals = 0 : $decimal_separator = '.' : $thousands_separator = ','}",
  },
  {
    name: 'md5',
    detail: "{$string | md5}",
  },
  {
    name: 'sha1',
    detail: "{$string | sha1}",
  },
  {
    name: 'crc32',
    detail: "{$string | crc32}",
  },
  {
    name: 'urldecode',
    detail: "{$url | urlencode}",
  },
  {
    name: 'urlencode',
    detail: "{$url | urldecode}",
  },
  {
    name: 'rawurldecode',
    detail: "{$url | rawurldecode}",
  },
  {
    name: 'base64_decode',
    detail: "{$string | base64_decode}",
  },
  {
    name: 'base64_encode',
    detail: "{$string | base64_encode}",
  },
  {
    name: ['toJSON', 'json_encode'],
    detail: "{$array | {name}}",
  },
  {
    name: ['fromJSON', 'json_decode'],
    detail: "{$json_string | {name}}",
  },
  {
    name: 'http_build_query',
    detail: "{$array | http_build_query}",
  },
  {
    name: 'print_r',
    detail: "{$array | print_r : $wrap}",
  },
  {
    name: ['var_dump', 'dump'],
    detail: "{$array | {name}}",
  },
  {
    name: 'nl2br',
    detail: "{$string | nl2br}",
  },
  {
    name: 'ucwords',
    detail: "{$string | ucwords}",
  },
  {
    name: 'ucfirst',
    detail: "{$string | ucfirst}",
  },
  {
    name: ['htmlent', 'htmlentities'],
    detail: "{$string | {name}}",
  },
  {
    name: 'limit',
    detail: "{$string | limit : $limit}",
  },
  {
    name: ['esc', 'tag'],
    detail: "{$string | {name}}",
  },
  {
    name: ['notags', 'striptags', 'stripTags', 'strip_tags'],
    detail: "{$string | {name}}",
  },
  {
    name: 'stripmodxtags',
    detail: "{$string | stripmodxtags}",
  },
  {
    name: 'cdata',
  },
  {
    name: ['reverse', 'strrev'],
    detail: "{$string | {name}}",
  },
  {
    name: 'wordwrap',
    detail: "{$string | wordwrap : $width}",
  },
  {
    name: 'wordwrapcut',
    detail: "{$string | wordwrapcut : $width}",
  },
  {
    name: 'fuzzydate',
    detail: "{$date | fuzzydate : $format = '%b %e'}",
  },
  {
    name: ['declension', 'decl'],
    detail: "{$number | {name} : $variants : $number = false : $delimiter = '|'}",
  },
  {
    name: ['ismember', 'memberof', 'mo'],
    detail: "{$number | {name} : $group}",
  },
  {
    name: ['isloggedin', 'isnotloggedin'],
    detail: "{$number | {name} : $context}",
  },
  {
    name: 'url',
    detail: "{$id | url : $options : $args}",
  },
  {
    name: 'lexicon',
    detail: "{$key | lexicon : $params = [] : $language = ''}",
  },
  {
    name: ['user', 'userinfo'],
    detail: "{$id | {name} : $field = 'username'}",
  },
  {
    name: 'resource',
    detail: "{$id | resource : $field = null}",
  },
  {
    name: 'print',
    detail: "{$var | print : $wrap = true}",
  },
  {
    name: 'setOption',
    detail: "{$value | setOption : $key}",
  },
  {
    name: ['option', 'getOption', 'config'],
    detail: "{$key | {name}}",
  },
  {
    name: ['setPlaceholder', 'toPlaceholder'],
    detail: "{$value | {name} : $key}",
  },
  {
    name: ['placeholder', 'fromPlaceholder'],
    detail: "{$key | {name}}",
  },
  {
    name: 'cssToHead',
    detail: "{$string | cssToHead}",
  },
  {
    name: 'htmlToHead',
    detail: "{$string | htmlToHead}",
  },
  {
    name: 'htmlToBottom',
    detail: "{$string | htmlToBottom}",
  },
  {
    name: 'jsToHead',
    detail: "{$string | jsToHead : $plaintext = false}",
  },
  {
    name: 'jsToBottom',
    detail: "{$string | jsToBottom : $plaintext = false}",
  },
  {
    name: 'preg_quote',
    detail: "{$string | preg_quote}",
  },
  {
    name: 'preg_match',
    detail: "{$string | preg_match : $pattern}",
  },
  {
    name: 'preg_get',
    detail: "{$string | preg_get : $pattern : $group = 0}",
  },
  {
    name: 'preg_get_all',
    detail: "{$string | preg_get_all : $pattern : $group = 0}",
  },
  {
    name: 'preg_grep',
    detail: "{$string | preg_grep : $pattern : $flags = ''}",
  },
  {
    name: 'preg_replace',
    detail: "{$string | preg_replace : $pattern : $replacement = '' : $limit = -1}",
  },
  {
    name: 'preg_filter',
    detail: "{$string | preg_filter : $pattern : $replacement = '' : $limit = -1}",
  },
  {
    name: 'preg_split',
    detail: "{$string | preg_split : $pattern}",
  },

  {
    name: 'snippet',
    detail: "{$name | snippet : $params = []}",
  },
  {
    name: 'chunk',
    detail: "{$name | chunk : $params = []}",
  },
];
