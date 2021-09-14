import * as fs from 'fs';

export type PropertyString = string;
export type PropertyArray = Property[];
export type PropertyDictionary = { [key: string]: Property };

export type Property = PropertyString | PropertyArray | PropertyDictionary;

export class PropertyListParser {
  public static read(file: string): Property {
    const text = fs.readFileSync(file, 'utf8');
    return PropertyListParser.parse(text);
  }

  public static parse(text: string): Property {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') return PropertyListParser.parseDictionary(text, i)[0];
      if (text[i] === '(') return PropertyListParser.parseArray(text, i)[0];

      if (text[i] === '"') return PropertyListParser.parseString(text, i)[0];
      if (text[i] === "'") return PropertyListParser.parseString(text, i)[0];

      if (PropertyListParser.nonQuoteStringChar(text[i])) return PropertyListParser.parseString(text, i)[0];
    }

    return null;
  }

  public static nonQuoteStringChar(char: string): boolean {
    const code = char.charCodeAt(0);
    if (code > 64 && code < 91) return true;
    if (code > 96 && code < 123) return true;

    if (code === 95) return true;
    if (code === 45) return true;

    return false;
  }

  public static parseString(text: string, start: number): [PropertyString, number] {
    const charType = text[start];
    const nonQuote = charType !== '"' && charType !== '\'';

    for (let i = start + 1; i < text.length; i++) {
      if (nonQuote && !PropertyListParser.nonQuoteStringChar(text[i])) return [text.substring(start, i), i];
      
      if (text[i] === '\\') {
        const nextChar = text[i + 1];
        if (nextChar === '\\') {
          i++;
          continue;
        }
        if (nextChar === '"') {
          i++;
          continue;
        }
      }
      if (text[i] === '\'') {
        const nextChar = text[i + 1];
        if (nextChar === '\'') {
          i++;
          continue;
        }
      }

      if (text[i] === '\'' && text[i] === charType) return [text.substring(start + 1, i).replace(/\'\'/g, '\''), i + 1];
      if (text[i] === '"' && text[i] === charType) return [JSON.parse(text.substring(start, i + 1)), i + 1];
    }
    
    return [text.substring(start, text.length), text.length];
  }
  public static parseArray(text: string, start: number): [PropertyArray, number] {
    const array: PropertyArray = [];
    let value: Property;

    for (let i = start + 1; i < text.length; i++) {
      if (text[i] === '{') [value, i] = PropertyListParser.parseDictionary(text, i);
      if (text[i] === '(') [value, i] = PropertyListParser.parseArray(text, i);

      if (text[i] === '"') [value, i] = PropertyListParser.parseString(text, i);
      if (text[i] === "'") [value, i] = PropertyListParser.parseString(text, i);

      if (PropertyListParser.nonQuoteStringChar(text[i])) [value, i] = PropertyListParser.parseString(text, i);

      if (text[i] === ',') {
        array.push(value);
        value = null;
      }

      if (text[i] === ')') {
        if (value) array.push(value);
        return [array, i + 1];
      }
    }
    
    if (value) array.push(value);
    return [array, text.length];
  }
  public static parseDictionary(text: string, start: number): [PropertyDictionary, number] {
    const dictionary: PropertyDictionary = {};
    let key: string;
    let value: Property;

    for (let i = start + 1; i < text.length; i++) {
      if (key) {
        if (text[i] === '{') [value, i] = PropertyListParser.parseDictionary(text, i);
        if (text[i] === '(') [value, i] = PropertyListParser.parseArray(text, i);

        if (text[i] === '"') [value, i] = PropertyListParser.parseString(text, i);
        if (text[i] === "'") [value, i] = PropertyListParser.parseString(text, i);

        if (PropertyListParser.nonQuoteStringChar(text[i])) [value, i] = PropertyListParser.parseString(text, i);

        if (value) {
          if (text[i] === ';') {
            dictionary[key] = value;
            key = null;
            value = null;
          }
        }
      } else {
        if (text[i] === '"') [key, i] = PropertyListParser.parseString(text, i);
        if (text[i] === "'") [key, i] = PropertyListParser.parseString(text, i);

        if (PropertyListParser.nonQuoteStringChar(text[i])) [key, i] = PropertyListParser.parseString(text, i);
      }
      if (text[i] === '}') {
        if (value) dictionary[key] = value;
        return [dictionary, i + 1];
      }
    }
    
    if (value) dictionary[key] = value;
    return [dictionary, text.length];
  }
}