import { LanguageConfig } from "languageParser";

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

export type Result = Array<string | Array<Result>>;
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

  static build(language: LanguageConfig) {
    
  }

  static parse(bytes: Uint8Array, schema = this.languageSchema): Result {
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
    let value = bytes[pos] % 0x7f;
    let i = 0;

    while (bytes[pos + i] > 0x7f) {
      i++;
      value += (bytes[pos + i] % 0x7f) << (7 * i);
    }

    return [value, pos + i + 1];
  }

  static parseString(bytes: Uint8Array, pos: number, structure: SchemaString): [Result, number] {
    let length: number;
    [length, pos] = this.parseNumber(bytes, pos);

    const str = this.binaryToString(bytes.slice(pos, pos + length));
    return [str, pos + length];
  }
  static parseTuple(bytes: Uint8Array, pos: number, structure: SchemaTuple): [Result, number] {
    let length: number;
    [length, pos] = this.parseNumber(bytes, pos);
    
    const values: Result = [];
    for (let i = 0; i < length; i++) {
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
  static parseSchema(bytes: Uint8Array, pos: number, structure: Schema): [Result, number] {
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
    const bytes = new Uint8Array(str.length + 1);
    bytes[0] = str.length;

    for (let i = 0; i < str.length; i++) bytes[i + 1] = str.charCodeAt(i);
    return bytes;
  }

  static binaryToString(bytes: Uint8Array) {
    return String.fromCharCode.apply(null, bytes);
  }
}