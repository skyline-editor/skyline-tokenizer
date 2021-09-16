import { suite, test, should } from './utility';
import { mock, instance } from 'ts-mockito';
import { highlight } from '../src/highlighter';
import { expect } from 'chai';

should;
@suite class HighlighterUnitTests {
  before() {

  }

  @test 'test basic language'() {
    const code = `"Hello \\"World\\"!"`;
    const language = [
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
    ];


    const result = highlight(code, language, ['source.abc']);
    expect(result).to.deep.equal([
      {
        scopes: ['string.quoted.double.untitled', 'source.abc'],
        value: '"Hello '
      },
      {
        scopes: ['constant.character.escape.untitled', 'string.quoted.double.untitled', 'source.abc'],
        value: '\\"'
      },
      {
        scopes: ['string.quoted.double.untitled', 'source.abc'],
        value: 'World'
      },
      {
        scopes: ['constant.character.escape.untitled', 'string.quoted.double.untitled', 'source.abc'],
        value: '\\"'
      },
      {
        scopes: ['string.quoted.double.untitled', 'source.abc'],
        value: '!"'
      }
    ]);
  }
}