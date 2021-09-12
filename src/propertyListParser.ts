type PropertyString = string;
type PropertyArray = Property[];
type PropertyDictionary = { [key: string]: Property };

type Property = PropertyString | PropertyArray | PropertyDictionary;

export class PropertyListParser {
  public static parse(text: string): Property {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') return PropertyListParser.parseDictionary(text, i);
      if (text[i] === '[') return PropertyListParser.parseArray(text, i);

      if (text[i] === '"') return PropertyListParser.parseString(text, i);
      if (text[i] === "'") return PropertyListParser.parseString(text, i);

      if (PropertyListParser.nonQuoteStringChar(text[i])) return PropertyListParser.parseString(text, i);
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

  public static parseString(text: string, start: number): PropertyString {
    const charType = text[start];
    const nonQuote = charType !== '"' && charType !== '\'';

    for (let i = start + 1; i < text.length; i++) {
      if (nonQuote && !PropertyListParser.nonQuoteStringChar(text[i])) return text.substring(start, i + 1);
      
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

      if (text[i] === '\'') return text.substring(start + 1, i).replace(/\'\'/g, '\'');
      if (text[i] === '"') return JSON.parse(text.substring(start, i + 1));
    }
    
    return text.substring(start, text.length);
  }
  public static parseArray(text: string, start: number): PropertyArray {
    
    return null;
  }
  public static parseDictionary(text: string, start: number): PropertyDictionary {
    
    return null;
  }
}