import { PropertyListParser } from "./propertyListParser";

export interface LanguagePattern {
  name?: string;
  match?: string;
  begin?: string;
  end?: string;
  patterns?: LanguagePattern[];
  contentName?: string;
  
  captures?: {
    [key: number]: LanguagePattern;
  };
  beginCaptures?: {
    [key: number]: LanguagePattern;
  };
  endCaptures?: {
    [key: number]: LanguagePattern;
  };
  include?: string;
}
export interface LanguageConfig {
  scopeName: string;
  fileTypes?: string[];
  foldingStartMarker?: string;
  foldingStopMarker?: string;
  patterns: LanguagePattern[];

  firstLineMatch?: string;
  repository?: {
    [key: string]: LanguagePattern;
  }
}

export interface LanguageResult {
  groups: string[];
  value: string;
}

interface Match {
  pattern: LanguagePattern;
  type: 'begin' | 'match' | 'end';
  match: RegExpMatchArray;
}

export class LanguageParser {
  private config: LanguageConfig;

  constructor(config: string | LanguageConfig) {
    if (typeof config !== 'string') {
      this.config = config;
      return;
    }

    const parsed = PropertyListParser.read(config)
    if (typeof parsed === 'string') throw new Error('Invalid language config, config was of type string');
    if (Array.isArray(parsed)) throw new Error('Invalid language config, config was of type array');
    
    const properties = ['scopeName', 'fileTypes', 'foldingStartMarker', 'foldingStopMarker', 'patterns'];
    const languageConfig = {} as LanguageConfig;

    for (const property of properties) {
      if (!(property in parsed)) throw new Error(`Invalid language config, missing property ${property}`);
      languageConfig[property] = parsed[property];
    }
    this.config = languageConfig;
  }

  getConfig(): LanguageConfig {
    return this.config;
  }

  read(file: string): LanguageResult[] {
    const text = require('fs').readFileSync(file, 'utf8');
    return this.parse(text);
  }

  parse(text: string): LanguageResult[] {
    const results: LanguageResult[] = [];
    const patterns = this.config.patterns;

    const all_matches: Match[] = [];
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      if (pattern.include) {
        let include;
        if (pattern.include.startsWith('#')) include = this.config.repository[pattern.include.substr(1)];
        if (pattern.include === '$self') include = pattern;
        if (!include) throw new Error(`Invalid language config, include ${pattern.include} not found`);

        patterns.splice(i, 1);
        i--;

        if (!patterns.includes(include)) patterns.push(include);
        continue;
      }

      if (pattern.patterns) {
        for (let j = 0; j < pattern.patterns.length; j++) {
          const include = pattern.patterns[j];
          if (!patterns.includes(include)) patterns.push(include);
        }
      }
    }
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      this.parsePattern(pattern, text, all_matches);
    }

    let index = 0;
    let nesting: LanguagePattern[] = [];
    let current_result: LanguageResult = { groups: [], value: '' };

    

    console.log(patterns);
    console.log(all_matches);

    return results;
  }

  private parsePattern(pattern: LanguagePattern, text: string, all_matches: Match[]) {
    this.searchMatch(pattern, 'begin', text, all_matches);
    this.searchMatch(pattern, 'match', text, all_matches);
    this.searchMatch(pattern, 'end'  , text, all_matches);
  }

  private searchMatch(pattern: LanguagePattern, type: 'begin' | 'match' | 'end' , text: string, all_matches: Match[]) {
    if (!pattern[type]) return;

    const matches = text.matchAll(new RegExp(pattern[type], 'g'));
    for (const match of matches) {
      let j = all_matches.length;
      for (let i = 0; i < all_matches.length; i++) {
        if (all_matches[i].match.index < match.index) continue;
        j = i;
        break;
      }
      all_matches.splice(j, 0, { pattern, type, match });
    }
  }
}