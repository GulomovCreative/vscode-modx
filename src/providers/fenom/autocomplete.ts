import { MainCompletionProvider } from '../autocomplete';
import { tags } from './tag';
import { inRange } from 'lodash';

export type ParsedSnippet = {
  name: string
  enteredProps: string[]
} | false

export type ParsedTag = {
  name: string,
  args: string,
  body: string,
}

export class FenomCompletionProvider extends MainCompletionProvider {
  getParentTags(): ParsedTag[] {
    const before = this.getBefore();
    const matches = [...before.matchAll(/{(\/?[a-z]+)\s?([^{}]*)}/g)] || [];
    const parsedTags = matches.map(([ body, name, args ]) => ({ name, args, body }));
    const pairedTags = parsedTags.reduce((result, tag) => {
      if (tag.name.startsWith('/')) {
        const index = result.reverse().findIndex(item => item.name === tag.name.replace(/^\//, ''));

        if (index !== -1) {
          result.splice(index, 1);
          return result.reverse();
        }
      }

      if (
        tag.name === 'set' && !tag.args.includes('=')
        || tags.some(item => item.name === tag.name && item.paired)
      ) {
        result.push(tag);
      }

      return result;
    }, [] as ParsedTag[]);

    return pairedTags;
  }

  getClosestTag(): ParsedTag | undefined {
    return this.getParentTags().at(-1);
  }

  getRootTag(): ParsedTag | undefined {
    return this.getParentTags().at(0);
  }

  hasExtendsBefore (): boolean {
    const before = this.getBefore();

    return /(?<!{\*\s*?){extends .*}/.test(before);
  }

  get isInMustache(): boolean {
    const { position, document } = this.context;

    return Boolean(document.getWordRangeAtPosition(position, /{([^}])+}/));
  }

  get isInMustacheBlock(): boolean {
    if (this.isInMustache) {
      return true;
    }

    const { document, position } = this.context;
    const blocks = this.getBlocks();
    const positionOffset = document.offsetAt(position);

    return blocks.some(block => inRange(positionOffset, block.start, block.end));
  }

  getBody(): {
    before: string,
    after: string,
    text: string,
  } | false {
    const { position, document } = this.context;
    const positionOffset = document.offsetAt(position);
    const blocks = this.getBlocks().reverse();

    const block = blocks.find(block => inRange(positionOffset, block.start, block.end));

    if (!block) {
      return false;
    }

    const text = block.input;
    const tmpOffset = positionOffset - block.start;

    return {
      before: text.slice(0, tmpOffset),
      after: text.slice(tmpOffset),
      text,
    };
  }

  getSnippet(): ParsedSnippet {
    const body = this.getBody();

    if (!body) {
      return false;
    }

    const { text } = body;
    let { before, after } = body;
    let diff = 0;

    const calls = [...before.matchAll(/\$_modx->runSnippet\(['"]!?[\w@]['"],\s*\[|['"]!?[\w@]+['"]\s*\|\s*snippet\s*:\s*\[/g)] || [];
    const lastCall = calls.at(-1);

    if (!lastCall) {
      return false;
    }

    const squares = [...before.matchAll(/\[|\]/g)].reverse() || [];
    for (const match of squares) {
      const char = match[0];

      if (char === '[') {
        diff++;
      } else if (char === ']') {
        diff--;
      }

      if (diff === 1 && lastCall.index) {
        before = before.substring(lastCall.index);
        break;
      }
    }

    after: {
      const squares = [...after.matchAll(/\[|\]/g)] || [];
      for (const match of squares) {
        if (match[0] === '[') {
          diff++;
        } else {
          diff--;
        }

        if (diff === 0 && match.index) {
          after = after.substring(0, match.index + 1);
          break after;
        }
      }
    }

    if (!before || !after) {
      return false;
    }

    const [ , name ] = text.match(/['"]!?(.*?)(@.*)?['"]/) || [];
    const [ bodyArray = '' ] = text.match(/\[.*\]/s) || [];

    let cleaned = bodyArray;
    let lastCleaned = cleaned;

    while (cleaned) {
      lastCleaned = cleaned;
      cleaned = cleaned.replace(/\[[^[\]]*\]/g, '');
    }

    const enteredProps = [...lastCleaned.matchAll(/(?<=[,['"]\s*)['"](\w*?)['"]\s*=>/g)].map(([ , match ]) => match);

    return {
      name,
      enteredProps,
    };
  }

  getBlocks(): {
    start: number,
    end: number,
    input: string,
  }[] {
    const { document } = this.context;
    const text = document.getText();

    return [...text.matchAll(/{[^'"}]*(("[^"]*"|'[^']*')[^'"}]*)*}/gm)].map(match => {
      const [ input = '' ] = match;
      const index = match.index || 0;

      return {
        input,
        start: index,
        end: index + input.length,
      };
    });
  }
}
