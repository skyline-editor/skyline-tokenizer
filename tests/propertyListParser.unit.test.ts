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
  @test 'test double quote strings with single quote inside'() {
    const result = PropertyListParser.parse(`"Hello 'World'"`);
    expect(result).to.equal('Hello \'World\'');
  }
  @test 'test single quote strings with double quote inside'() {
    const result = PropertyListParser.parse(`'Hello "World"'`);
    expect(result).to.equal('Hello "World"');
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


  @test 'test empty array'() {
    const result = PropertyListParser.parse(`()`);
    expect(result).to.deep.equal([]);
  }
  @test 'test array with nested empty array'() {
    const result = PropertyListParser.parse(`(())`);
    expect(result).to.deep.equal([[]]);
  }

  @test 'test array with quoted string'() {
    const result = PropertyListParser.parse(`("foo","bar","fud")`);
    expect(result).to.deep.equal([ 'foo', 'bar', 'fud' ]);
  }
  @test 'test array with unquoted strings'() {
    const result = PropertyListParser.parse(`(Foo,_abcd_,bar)`);
    expect(result).to.deep.equal([ 'Foo', '_abcd_', 'bar' ]);
  }
  @test 'test array with mixed strings'() {
    const result = PropertyListParser.parse(`("Hello World!",FooBar,_under_score__,bar)`);
    expect(result).to.deep.equal([ 'Hello World!', 'FooBar', '_under_score__', 'bar' ]); 
  }

  @test 'test array with nested array with quoted strings'() {
    const result = PropertyListParser.parse(`(("foo","bar","fud"))`);
    expect(result).to.deep.equal([[ 'foo', 'bar', 'fud' ]]);
  }
  @test 'test array with mixed nested strings'() {
    const result = PropertyListParser.parse(`("Hello World!",FooBar,(abcd,_abc,"Hi"))`);
    expect(result).to.deep.equal([ 'Hello World!', 'FooBar', [ 'abcd', '_abc', 'Hi' ] ]);
  }

  @test 'test spaced array'() {
    const result = PropertyListParser.parse(` ( "Hello World!" , FooBar , _under_score__ , bar ) `);
    expect(result).to.deep.equal([ 'Hello World!', 'FooBar', '_under_score__', 'bar' ]);
  }
  @test 'test spaced array with nested array'() {
    const result = PropertyListParser.parse(` ( ("Hello World!" , FooBar , _under_score__ , bar ) ) `);
    expect(result).to.deep.equal([[ 'Hello World!', 'FooBar', '_under_score__', 'bar' ]]);
  }


  @test 'test empty dictionary'() {
    const result = PropertyListParser.parse(`{}`);
    expect(result).to.deep.equal({});
  }
  @test 'test dictionary with quoted string'() {
    const result = PropertyListParser.parse(`{"foo"="bar";"fud"="fud";}`);
    expect(result).to.deep.equal({ 'foo': 'bar', 'fud': 'fud' });
  }
  @test 'test dictionary with unquoted strings'() {
    const result = PropertyListParser.parse(`{Foo=_abcd_;bar=bar;}`);
    expect(result).to.deep.equal({ 'Foo': '_abcd_', 'bar': 'bar' });
  }
  @test 'test dictionary with mixed strings'() {
    const result = PropertyListParser.parse(`{Foo="Hello World!";_under_score__=bar;}`);
    expect(result).to.deep.equal({ 'Foo': 'Hello World!', '_under_score__': 'bar' });
  }
  @test 'test dictionary with nested array with quoted strings'() {
    const result = PropertyListParser.parse(`{"foo"=("bar","fud","fud");}`);
    expect(result).to.deep.equal({ 'foo': [ 'bar', 'fud', 'fud' ] });
  }
  @test 'test dictionary with nested dictionary with quoted strings'() {
    const result = PropertyListParser.parse(`{"foo"={"bar"="fud";};}`);
    expect(result).to.deep.equal({ 'foo': { 'bar': 'fud' } });
  }
  @test 'test array with nested dictionary with quoted strings'() {
    const result = PropertyListParser.parse(`({"foo"="bar";},{"fud"="fud";})`);
    expect(result).to.deep.equal([{ 'foo': 'bar' }, { 'fud': 'fud' }]);
  }

  @test 'test spaced dictionary'() {
    const result = PropertyListParser.parse(` { "foo" = "bar"; "fud" = "fud"; } `);
    expect(result).to.deep.equal({ 'foo': 'bar', 'fud': 'fud' });
  }
  @test 'test spaced dictionary with nested array'() {
    const result = PropertyListParser.parse(` { "foo" = ( "bar" , "fud" , "fud" ); } `);
    expect(result).to.deep.equal({ 'foo': [ 'bar', 'fud', 'fud' ] });
  }
  @test 'test spaced dictionary with nested dictionary'() {
    const result = PropertyListParser.parse(` { "foo" = { "bar" = "fud"; }; } `);
    expect(result).to.deep.equal({ 'foo': { 'bar': 'fud' } });
  }
  @test 'test spaced dictionary with nested array with dictionary'() {
    const result = PropertyListParser.parse(` { "foo" = ( { "bar" = "fud"; } ); } `);
    expect(result).to.deep.equal({ 'foo': [ { 'bar': 'fud' } ] });
  }
}