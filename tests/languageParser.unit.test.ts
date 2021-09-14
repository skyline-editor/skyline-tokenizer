import { suite, test, should } from './utility';
import { mock, instance } from 'ts-mockito';
import { LanguageConfig, LanguageParser } from '../src/languageParser';
import { expect } from 'chai';

should;
@suite class LanguageParserUnitTests {
  before() {

  }

  @test 'test basic language config'() {
    const config: LanguageConfig = {
      "scopeName": "source.abc",
      "patterns": [{ "include": "#expression" }],
      "repository": {
        "expression": {
          "patterns": [{ "include": "#letter" }, { "include": "#paren-expression" }]
        },
        "letter": {
          "match": "a|b|c",
          "name": "keyword.letter"
        },
        "paren-expression": {
          "begin": "\\(",
          "end": "\\)",
          "beginCaptures": {
            "0": { "name": "punctuation.paren.open" }
          },
          "endCaptures": {
            "0": { "name": "punctuation.paren.close" }
          },
          "name": "expression.group",
          "patterns": [
            { "include": "#expression" }
          ]
        }
      }
    };
    const input = `a ( b )`;
    const languageParser = new LanguageParser(config);
    const result = languageParser.parse(input);
    expect(result).to.deep.equal([
      {
        "name": "keyword.letter",
        "scopes": ["source.abc", "keyword.letter"]
      },
      {
        "name": "punctuation.paren.open",
        "scopes": ["source.abc", "expression.group", "punctuation.paren.open"]
      },
      {
        "name": "keyword.letter",
        "scopes": ["source.abc", "expression.group", "keyword.letter"]
      },
      {
        "name": "punctuation.paren.close",
        "scopes": ["source.abc", "expression.group", "punctuation.paren.close"]
      }
    ]);
  }
}