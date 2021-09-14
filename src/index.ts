import { LanguageParser } from "./languageParser";
const parser = new LanguageParser('./language.plist');
parser.read('./test.txt');