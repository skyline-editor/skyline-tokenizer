import { BinaryLanguageFile } from "./buildFile";
import * as fs from 'fs';

const json_file = fs.readFileSync('../tests/files/language.json', 'utf8');
let sl;

const schema = BinaryLanguageFile.languageSchema;

console.time('parse json');
const json = JSON.parse(json_file);
console.timeEnd('parse json');

console.time('build');
sl = BinaryLanguageFile.buildLanguage(json);
console.timeEnd('build');

console.time('parse sl');
const data = BinaryLanguageFile.parse(sl, schema);
console.timeEnd('parse sl');

BinaryLanguageFile.buildLanguageFile(json, './test.slLanguage')


console.log(data, json);