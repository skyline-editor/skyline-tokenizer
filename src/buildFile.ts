import { LanguageConfig, LanguageParser, LanguagePattern } from "languageParser";

export type SchemaString = {
  type: 'string';
};
export type SchemaTuple = {
  type: 'tuple';

  values: Array<SchemaType>;
};
export type SchemaArray = {
  type: 'array';

  value: SchemaType;
};
export type Schema = {
  type: 'schema';
  
  required: Array<SchemaType>;
  optionals: Array<SchemaType>;
};

export type Result = string | Array<Result>;
export type SchemaType = SchemaString | SchemaTuple | SchemaArray | Schema;

export const string = (): SchemaString => ({
  type: 'string',
});
export const tuple = (...values: Array<SchemaType>): SchemaTuple => ({
  type: 'tuple',
  values,
});
export const array = (value: SchemaType): SchemaArray => ({
  type: 'array',
  value,
});
export const schema = (required?: Array<SchemaType>, optionals?: Array<SchemaType>): Schema => ({
  type: 'schema',

  required: required ?? [],
  optionals: optionals ?? [],
});

export class BinaryLanguageFile {
  static get languageSchema(): Schema {
    const pattern = schema();
    pattern.optionals = [
      string(), // name
      string(), // match
      string(), // begin
      string(), // end
      string(), // contentName
      array(tuple(string() /* index */, string() /* name */)), // captures
      array(tuple(string() /* index */, string() /* name */)), // beginnCaptures
      array(tuple(string() /* index */, string() /* name */)), // endCaptures

      string(), // include
      array(pattern) // patterns
    ];

    const language = schema(
      [
        string(), // scopeName
        array(string()), // fileTypes
        string(), // foldingStartMarker
        string(), // foldingEndMarker
        array(pattern), // patterns
      ],
      [
        string(), // firstLineMatch
        array(pattern), // repository
      ]
    );

    return language;
  }

  static addName(names: Array<string>, name: string): number {
    const index = names.indexOf(name);
    if (index > -1) return index;

    names.push(name);
    return names.length - 1;
  }

  static parseInclude(include: string, names: Array<string>) {
    if (!include.startsWith('#')) return include;

    const index = this.addName(names, include.substr(1));
    return `#${index}`;
  }

  static buildCaptures(captures: LanguagePattern['captures']): Result[] {
    const results: Array<Result> = [];

    const keys = Object.keys(captures);
    for (let i = 0; i < keys.length; i++) {
      const key = parseInt(keys[i]);
      const value = captures[key];
      const name = value.name;

      results.push([ key.toString(), name ]);
    }

    return results;
  }

  static buildPattern(pattern: LanguagePattern, names: Array<string>): Result {
    const data = [
      pattern.name ?? null,
      pattern.match ?? null,

      pattern.begin ?? null,
      pattern.end ?? null,

      pattern.contentName ?? null,

      pattern.captures ? this.buildCaptures(pattern.captures) : null,
      pattern.beginCaptures ? this.buildCaptures(pattern.beginCaptures) : null,
      pattern.endCaptures ? this.buildCaptures(pattern.endCaptures) : null,

      pattern.include ? this.parseInclude(pattern.include, names) : null,
      pattern.patterns ? this.buildPatterns(pattern.patterns, names) : null,
    ];
    return data;
  }

  static buildPatterns(patterns: LanguagePattern[], names: Array<string>): Result[] {
    const results: Array<Result> = [];
    for (let i = 0; i < patterns.length; i++) {
      results.push(this.buildPattern(patterns[i], names));
    }
    
    return results;
  }
  static buildRepository(repository: {[key: string]: LanguagePattern}, names: Array<string>): Result[] {
    const results: Array<Result> = [];
    const map = new Map<string, Result>();

    const keys = Object.keys(repository);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      map.set(key, this.buildPattern(repository[key], names));
    }
    for (let i = 0; i < names.length; i++) {
      const key = names[i];
      if (!map.has(key)) continue;

      results.push(map.get(key));
    }

    return results;
  }

  static buildLanguage(language: LanguageConfig) {
    const names = [];

    const data = [
      // required
      language.scopeName,
      language.fileTypes,
      language.foldingStartMarker,
      language.foldingStopMarker,
      this.buildPatterns(language.patterns, names),

      // optional
      language.firstLineMatch ?? null,
      language.repository ? this.buildRepository(language.repository, names) : null
    ];

    return this.build(data, this.languageSchema);
  }

  static build(input: Result[], schema: Schema): Uint8Array {
    const result = this.buildSchema(input, schema);
    return result;
  }

  static buildType(type: SchemaType, value: Result): Uint8Array {
    switch (type.type) {
      case 'string':
        if (typeof value !== 'string') return new Uint8Array(0);
        return this.buildString(value, type);
      case 'tuple':
        if (!Array.isArray(value)) return new Uint8Array(0);
        return this.buildTuple(value, type);
      case 'array':
        if (!Array.isArray(value)) return new Uint8Array(0);
        return this.buildArray(value, type);
      case 'schema':
        if (!Array.isArray(value)) return new Uint8Array(0);
        return this.buildSchema(value, type);
    }
  }

  static buildNumber(value: number): Uint8Array {
    let length = 1;

    {
      let v = value;
      while (v > 0x7f) {
        length++;
        v >>= 7;
      }
    }

    let bytes = new Uint8Array(length);
    let i = 0;

    while (value > 0x7f) {
      bytes[i++] = (value & 0x7f) | 0x80;
      value = value >> 7;
    }

    bytes[i++] = value;
    return bytes;
  }

  static buildString(str: string, _structure: SchemaString): Uint8Array {
    const string = this.stringToBinary(str);
    const number = this.buildNumber(string.length);

    const bytes = new Uint8Array(string.length + number.length);
    bytes.set(number, 0);
    bytes.set(string, number.length);

    return bytes;
  }

  static buildTuple(values: Array<Result>, structure: SchemaTuple): Uint8Array {
    let results: Array<Uint8Array> = [];
    let length = 0;

    for (let i = 0; i < structure.values.length; i++) {
      const value = values[i];
      const type = structure.values[i];
      
      const bytes = this.buildType(type, values[i]);
      results.push(bytes);
      length += bytes.length;
    }

    const bytes = new Uint8Array(length);

    let pos = 0;
    for (let i = 0; i < results.length; i++) {
      bytes.set(results[i], pos);
      pos += results[i].length;
    }

    return bytes;
  }
  static buildArray<T extends Result>(values: Array<T>, structure: SchemaArray): Uint8Array {
    const number = this.buildNumber(values.length);
    let results: Array<Uint8Array> = [ number ];
    let length = number.length

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const type = structure.value;
      
      const bytes = this.buildType(type, values[i]);
      results.push(bytes);
      length += bytes.length;
    }

    const bytes = new Uint8Array(length);

    let pos = 0;
    for (let i = 0; i < results.length; i++) {
      bytes.set(results[i], pos);
      pos += results[i].length;
    }

    return bytes;
  }
  static buildSchema(values: Array<Result>, structure: Schema): Uint8Array {
    const required: Array<Uint8Array> = [];
    const optionals: Array<Uint8Array> = [];
    let length = 0;

    for (let i = 0; i < structure.required.length; i++) {
      const value = values[i];
      const type = structure.required[i];
      
      const bytes = this.buildType(type, value);
      required.push(bytes);
      length += bytes.length;
    }

    let optional = 0;

    for (let i = 0; i < structure.optionals.length; i++) {
      const value = values[i + structure.required.length];
      const type = structure.optionals[i];   
      
      if (value !== null) {
        const bytes = this.buildType(type, value);
        optionals.push(bytes);
        length += bytes.length;

        optional |= 1 << i;
      }
    }
    
    const optional_bytes = this.buildNumber(optional);
    length += optional_bytes.length;

    const bytes = new Uint8Array(length);

    let index = 0;
    for (let i = 0; i < required.length; i++) {
      bytes.set(required[i], index);
      index += required[i].length;
    }

    bytes.set(optional_bytes, index);
    index += optional_bytes.length;

    for (let i = 0; i < optionals.length; i++) {
      bytes.set(optionals[i], index);
      index += optionals[i].length;
    }

    return bytes;
  }

  static parseCaptures(captures: Array<[string, string]>): LanguagePattern["captures"] {
    const result: LanguagePattern["captures"] = {};

    for (let i = 0; i < captures.length; i++) {
      const key = parseInt(captures[i][0]);
      const name = captures[i][1];

      result[key] = { name };
    }

    return result;
  }

  static parsePattern(pattern: Array<Result>): LanguagePattern {
    const result: LanguagePattern = {
      name: pattern[0] as string,
      match: pattern[1] as string,

      begin: pattern[2] as string,
      end: pattern[3] as string,

      contentName: pattern[4] as string,

      captures: pattern[5] && this.parseCaptures(pattern[5] as Array<[string, string]>),
      beginCaptures: pattern[6] && this.parseCaptures(pattern[6] as Array<[string, string]>),
      endCaptures: pattern[7] && this.parseCaptures(pattern[7] as Array<[string, string]>),

      include: pattern[8] as string,
      patterns: pattern[9] && this.parsePatterns(pattern[9] as Array<Array<Result>>),
    };

    return result;
  }

  static parsePatterns(patterns: Array<Array<Result>>): Array<LanguagePattern> {
    const result: Array<LanguagePattern> = [];
    for (let i = 0; i < patterns.length; i++) result.push(this.parsePattern(patterns[i]));

    return result;
  }
  static parseRepository(patterns: Array<Result>): {[key: string]: LanguagePattern} {
    const result: {[key: string]: LanguagePattern} = {};
    for (let i = 0; i < patterns.length; i++) result[i.toString()] = this.parsePattern(patterns[i] as Array<Result>);

    return result;
  }

  static parseLanguage(bytes: Uint8Array) {
    const data = this.parse(bytes, this.languageSchema);

    const language = {
      scopeName: data[0] as string,
      fileTypes: data[1] as Array<string>,
      foldingStartMarker: data[2] as string,
      foldingStopMarker: data[3] as string,
      patterns: this.parsePatterns(data[4] as Array<Array<Result>>),

      firstLineMatch: data[5] ?? null,
      repository: data[6] ? this.parseRepository(data[6] as Array<Result>) : null,
    } as LanguageConfig;

    return language;
  }

  static parse(bytes: Uint8Array, schema: Schema): Result[] {
    const [result, _] = this.parseSchema(bytes, 0, schema);
    return result;
  }

  static parseType(bytes: Uint8Array, pos: number, type: SchemaType): [Result, number] {
    switch (type.type) {
      case 'string':
        return this.parseString(bytes, pos, type);
      case 'tuple':
        return this.parseTuple(bytes, pos, type);
      case 'array':
        return this.parseArray(bytes, pos, type);
      case 'schema':
        return this.parseSchema(bytes, pos, type);
    }
  }

  static parseNumber(bytes: Uint8Array, pos: number): [number, number] {
    let value = bytes[pos] & 0x7f;
    let i = 0;

    while (bytes[pos + i] > 0x7f) {
      i++;
      value |= (bytes[pos + i] & 0x7f) << (7 * i);
    }

    return [value, pos + i + 1];
  }

  static parseString(bytes: Uint8Array, pos: number, _structure: SchemaString): [Result, number] {
    let length: number;
    [length, pos] = this.parseNumber(bytes, pos);

    const str = this.binaryToString(bytes.slice(pos, pos + length));
    return [str, pos + length];
  }
  static parseTuple(bytes: Uint8Array, pos: number, structure: SchemaTuple): [Result, number] {
    const values: Result = [];
    for (let i = 0; i < structure.values.length; i++) {
      let value;
      [value, pos] = this.parseType(bytes, pos, structure.values[i]);
      values.push(value);
    }
    
    return [values, pos];
  }
  static parseArray(bytes: Uint8Array, pos: number, structure: SchemaArray): [Result, number] {
    let length: number;
    [length, pos] = this.parseNumber(bytes, pos);
    
    const values: Result = [];
    for (let i = 0; i < length; i++) {
      let value;
      [value, pos] = this.parseType(bytes, pos, structure.value);
      values.push(value);
    }
    
    return [values, pos];
  }
  static parseSchema(bytes: Uint8Array, pos: number, structure: Schema): [Result[], number] {
    const schema = structure;
    const result = [];

    const required = schema.required;
    const optionals = schema.optionals;

    let index = pos;
    
    for (let i = 0; i < required.length; i++) {
      let value: Result;
      [value, index] = this.parseType(bytes, index, required[i]);
      
      result.push(value);
    }

    let optional;
    [optional, index] = this.parseNumber(bytes, index);

    for (let i = 0; i < optionals.length; i++) {
      let value: Result = null;
      if (optional % 2 > 0) [value, index] = this.parseType(bytes, index, optionals[i]);

      result.push(value);
      optional >>= 1;
    }

    return [result, index];
  }

  static stringToBinary(str: string) {
    const bytes = new Uint8Array(str.length);

    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
  }

  static binaryToString(bytes: Uint8Array) {
    return String.fromCharCode.apply(null, bytes);
  }
}