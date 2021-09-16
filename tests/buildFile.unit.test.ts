import { suite, test, should } from './utility';
import { mock, instance } from 'ts-mockito';
import { BinaryLanguageFile, schema, string } from '../src/buildFile';
import { expect } from 'chai';

should;
@suite class HighlighterUnitTests {
  before() {

  }

  @test 'test string to binary'() {
    const string = 'test string';
    const binary = BinaryLanguageFile.stringToBinary(string);

    expect(binary).to.deep.equal(new Uint8Array([ 0x0B, 0x74, 0x65, 0x73, 0x74, 0x20, 0x73, 0x74, 0x72, 0x69, 0x6E, 0x67 ]));
  }

  @test 'test parsing binary schema with a string'() {
    const test_schema = schema([ string() ], []);
    const binary = new Uint8Array([ 0x03, 0x41, 0x42, 0x43, 0x00 ]);
    const parsed = BinaryLanguageFile.parse(binary, test_schema);

    expect(parsed).to.deep.equal([ 'ABC' ]);
  }
  @test 'test parsing binary schema with multiple strings'() {
    const test_schema = schema([ string(), string(), string() ], []);
    const binary = new Uint8Array([ 0x03, 0x41, 0x42, 0x43,  0x03, 0x44, 0x45, 0x46,  0x03, 0x47, 0x48, 0x49,  0x00 ]);
    const parsed = BinaryLanguageFile.parse(binary, test_schema);

    expect(parsed).to.deep.equal([ 'ABC', 'DEF', 'GHI' ]);
  }

  @test 'test parsing binary schema with optional value'() {
    const test_schema = schema([ string(), string(), string() ], [ string() ]);
    const binary = new Uint8Array([ 0x03, 0x41, 0x42, 0x43,  0x03, 0x44, 0x45, 0x46,  0x03, 0x47, 0x48, 0x49,  0x01,  0x03, 0x4A, 0x4B, 0x4C ]);
    const parsed = BinaryLanguageFile.parse(binary, test_schema);

    expect(parsed).to.deep.equal([ 'ABC', 'DEF', 'GHI', 'JKL' ]);
  }
  @test 'test parsing binary schema with non included option value'() {
    const test_schema = schema([ string(), string(), string() ], [ string() ]);
    const binary = new Uint8Array([ 0x03, 0x41, 0x42, 0x43,  0x03, 0x44, 0x45, 0x46,  0x03, 0x47, 0x48, 0x49,  0x00 ]);
    const parsed = BinaryLanguageFile.parse(binary, test_schema);

    expect(parsed).to.deep.equal([ 'ABC', 'DEF', 'GHI', null ]);
  }

  @test 'test parsing binary schema with optional value and non included option value'() {
        const test_schema = schema([ string(), string(), string() ], [ string(), string() ]);
    const binary = new Uint8Array([ 0x03, 0x41, 0x42, 0x43,  0x03, 0x44, 0x45, 0x46,  0x03, 0x47, 0x48, 0x49,  0x02,  0x03, 0x4D, 0x4E, 0x4F ]);
    const parsed = BinaryLanguageFile.parse(binary, test_schema);

    expect(parsed).to.deep.equal([ 'ABC', 'DEF', 'GHI', null, 'MNO' ]);
  }
}