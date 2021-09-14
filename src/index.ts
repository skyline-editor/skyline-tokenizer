import { LanguageParser } from "./languageParser";
const parser = new LanguageParser('../tests/language.plist');
parser.read('../tests/test.txt');