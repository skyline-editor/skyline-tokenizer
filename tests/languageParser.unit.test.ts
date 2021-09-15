import { suite, test, should } from './utility';
import { mock, instance } from 'ts-mockito';
import { LanguageConfig, LanguageParser } from '../src/languageParser';
import { expect } from 'chai';

should;
@suite class LanguageParserUnitTests {
  private config: LanguageConfig;

  before() {
    this.config = {
      scopeName: 'source.abc',
      patterns: [
        {
          include: '#expression'
        }
      ],
      repository: {
        'expression': {
          patterns: [
            { include: '#selector' },
            { include: '#keyword' },
            { include: '#string' },
            { include: '#letter' },
            { include: '#paren-expression' }
          ]
        },
        'selector': {
          match: '(@selector\\()(.*?)(\\))',
          captures: {
            1: { name: 'storage.type.objc' },
            3: { name: 'storage.type.objc' }
          }
        },
        'keyword': {
          name: 'keyword.control.untitled',
          match: '\b(if|while|for|return)\b'
        },
        'string': {
          name: 'string.quoted.double.untitled',
          begin: '"',
          end: '"',
          patterns: [
            {
              name: 'constant.character.escape.untitled',
              match: '\\\\.'
            }
          ]
        },
        'letter': {
          match: 'a|b|c',
          name: 'keyword.letter'
        },
        'paren-expression': {
          begin: '\\(',
          end: '\\)',
          beginCaptures: {
            0: {
              name: 'punctuation.paren.open'
            }
          },
          endCaptures: {
            0: {
              name: 'punctuation.paren.close'
            }
          },
          name: 'expression.group',
          patterns: [
            {
              include: '#expression'
            }
          ]
        }
      }
    };
  }

  @test 'test basic language'() {
    const input = `a ( b )`;
    const languageParser = new LanguageParser(this.config);
    const result = languageParser.parse(input);
    expect(result).to.deep.equal([
      {
        scopes: ['keyword.letter', 'source.abc'],

        start: 0,
        end: 1,
      },
      {
        scopes: ['expression.group', 'source.abc'],

        start: 2,
        end: 7,
      },
      {
        scopes: ['punctuation.paren.open', 'expression.group', 'source.abc'],

        start: 2,
        end: 3,
      },
      {
        scopes: ['keyword.letter', 'expression.group', 'source.abc'],

        start: 4,
        end: 5,
      },
      {
        scopes: ['punctuation.paren.close', 'expression.group', 'source.abc'],

        start: 6,
        end: 7,
      }
    ]);
  }
  @test 'test language with captures'() {
    const input = `@selector(abce)`;
    const languageParser = new LanguageParser(this.config);
    const result = languageParser.parse(input);
    expect(result).to.deep.equal([
      {
        scopes: ['storage.type.objc', 'source.abc'],

        start: 0,
        end: 10,
      },
      {
        scopes: ['storage.type.objc', 'source.abc'],

        start: 14,
        end: 15,
      }
    ]);
  }
  @test 'test language with strings'() {
    const input = `"Hello \\"World\\"!"`;
    const languageParser = new LanguageParser(this.config);
    const result = languageParser.parse(input);
    expect(result).to.deep.equal([
      {
        scopes: ['string.quoted.double.untitled', 'source.abc'],

        start: 0,
        end: 18,
      },
      {
        scopes: ['constant.character.escape.untitled', 'string.quoted.double.untitled', 'source.abc'],

        start: 7,
        end: 9,
      },
      {
        scopes: ['constant.character.escape.untitled', 'string.quoted.double.untitled', 'source.abc'],

        start: 14,
        end: 16,
      }
    ]);
  }
}