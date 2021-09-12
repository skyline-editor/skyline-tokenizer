import { suite, test, should } from './utility';
import { mock, instance } from 'ts-mockito';
import { PropertyListParser } from '../src/propertyListParser';
import { expect } from 'chai';

should;
@suite class PropertyListParserUnitTests {
  before() {

  }

  @test 'test noquote uppercase char'() {
    const result = PropertyListParser.nonQuoteStringChar(`H`);
    expect(result).to.equal(true);
  }
  @test 'test noquote lowercase char'() {
    const result = PropertyListParser.nonQuoteStringChar(`h`);
    expect(result).to.equal(true);
  }
  @test 'test noquote underscore char'() {
    const result = PropertyListParser.nonQuoteStringChar(`_`);
    expect(result).to.equal(true);
  }
  @test 'test noquote char not included'() {
    const result = PropertyListParser.nonQuoteStringChar(` `);
    expect(result).to.equal(false);
  }

  @test 'test double quote strings'() {
    const result = PropertyListParser.parse(`"Hello"`);
    expect(result).to.equal('Hello');
  }
  @test 'test single quote strings'() {
    const result = PropertyListParser.parse(`'Hello'`);
    expect(result).to.equal('Hello');
  }
  @test 'test no quote strings'() {
    const result = PropertyListParser.parse(`Hello`);
    expect(result).to.equal('Hello');
  }

  @test 'test double quote strings with escaped quotes'() {
    const result = PropertyListParser.parse(`"Hello \\"World\\""`);
    expect(result).to.equal('Hello "World"');
  }
  @test 'test single quote strings with escaped quotes'() {
    const result = PropertyListParser.parse(`'Hello ''World'''`);
    expect(result).to.equal('Hello \'World\'');
  }

  @test 'test double quote strings with escaped quotes and escaped backslash'() {
    const result = PropertyListParser.parse(`"Hello \\"World\\" \\\\ "`);
    expect(result).to.equal('Hello "World" \\ ');
  }

  @test 'test space before strings'() {
    const result = PropertyListParser.parse(` "Hello"`);
    expect(result).to.equal('Hello');
  }
  @test 'test space after strings'() {
    const result = PropertyListParser.parse(`"Hello" `);
    expect(result).to.equal('Hello');
  }
  @test 'test space before and after strings'() {
    const result = PropertyListParser.parse(` "Hello" `);
    expect(result).to.equal('Hello');
  }
  @test 'test space before and after strings with escaped quotes'() {
    const result = PropertyListParser.parse(` "Hello \\"World\\"" `);
    expect(result).to.equal('Hello "World"');
  }
  @test 'test space before and after strings with escaped quotes and escaped backslash'() {
    const result = PropertyListParser.parse(` "Hello \\"World\\" \\\\ " `);
    expect(result).to.equal('Hello "World" \\ ');
  }

  @test 'test newline before strings'() {
    const result = PropertyListParser.parse(`\n"Hello"`);
    expect(result).to.equal('Hello');
  }
  @test 'test newline after strings'() {
    const result = PropertyListParser.parse(`"Hello"\n`);
    expect(result).to.equal('Hello');
  }
  @test 'test newline before and after strings'() {
    const result = PropertyListParser.parse(`\n"Hello"\n`);
    expect(result).to.equal('Hello');
  }
  @test 'test newline before and after strings with escaped quotes'() {
    const result = PropertyListParser.parse(`\n"Hello \\"World\\""\n`);
    expect(result).to.equal('Hello "World"');
  }
  @test 'test newline before and after strings with escaped quotes and escaped backslash'() {
    const result = PropertyListParser.parse(`\n"Hello \\"World\\" \\\\ "`);
    expect(result).to.equal('Hello "World" \\ ');
  }

  @test 'test newline and space before strings'() {
    const result = PropertyListParser.parse(`\n "Hello"`);
    expect(result).to.equal('Hello');
  }
  @test 'test newline and space after strings'() {
    const result = PropertyListParser.parse(`"Hello" \n`);
    expect(result).to.equal('Hello');
  }
  @test 'test newline and space before and after strings'() {
    const result = PropertyListParser.parse(`\n "Hello" \n`);
    expect(result).to.equal('Hello');
  }
  @test 'test newline and space before and after strings with escaped quotes'() {
    const result = PropertyListParser.parse(`\n "Hello \\"World\\"" \n`);
    expect(result).to.equal('Hello "World"');
  }
  @test 'test newline and space before and after strings with escaped quotes and escaped backslash'() {
    const result = PropertyListParser.parse(`\n "Hello \\"World\\" \\\\ "`);
    expect(result).to.equal('Hello "World" \\ ');
  }
}