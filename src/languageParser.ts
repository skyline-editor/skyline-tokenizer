import { PropertyListParser } from "./propertyListParser";

export interface LanguagePattern {
  name?: string;
  match?: string;
  begin?: string;
  end?: string;
  patterns?: LanguagePattern[];
  contentName?: string;
  
  captures?: {
    [key: number]: {
      name: string;
    };
  };
  beginCaptures?: {
    [key: number]: {
      name: string;
    };
  };
  endCaptures?: {
    [key: number]: {
      name: string;
    };
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
  scopes: string[];
  
  start: number;
  end: number;
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
    const patterns = Array.from(this.config.patterns);

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

      this.searchMatch(pattern, 'begin', text, all_matches);
      this.searchMatch(pattern, 'match', text, all_matches);
      this.searchMatch(pattern, 'end'  , text, all_matches);
    }

    const results = this.parsePatterns(this.config.patterns, all_matches, [ this.config.scopeName ])[0];
    return results;
  }
  private parsePatterns(patterns: LanguagePattern[], all_matches: Match[], groups: string[], start = 0, active_pattern: LanguagePattern = null): [ LanguageResult[], number ] {
    const results: LanguageResult[] = [];
    patterns = Array.from(patterns);
    
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

      if (pattern.patterns && !pattern.begin) {
        for (let j = 0; j < pattern.patterns.length; j++) {
          const include = pattern.patterns[j];
          if (!patterns.includes(include)) patterns.push(include);
        }
      }
    }

    let index = 0;
    let last_index = 0;
    for (let i = start; i < all_matches.length; i++) {
      const match = all_matches[i];
      last_index = i;
      
      if (index > match.match.index) continue;
      
      if (match.type === 'end') if (active_pattern) if (match.pattern === active_pattern) break;
      if (!patterns.includes(match.pattern)) continue;
      
      const result = this.parseMatch(match, groups, all_matches, i);
      if (result) {
        results.push(...result[0]);
        i = result[1];
        
        const match = all_matches[i];
        index = match.match.index + match.match[0].length;
      }
    }

    return [ results, last_index ];
  }

  private parseMatch(match: Match, groups: string[], all_matches: Match[], index: number): [ LanguageResult[], number] {
    if (match.type === 'begin') {
      groups = Array.from(groups);
      if (match.pattern.name) groups.unshift(match.pattern.name);
      
      const scopes = Array.from(groups);
      if (match.pattern.contentName) scopes.unshift(match.pattern.contentName);

      const results = this.parsePatterns(match.pattern.patterns, all_matches, scopes, index + 1, match.pattern);
      const endMatch = all_matches[results[1]];

      if (match.pattern.contentName) results[0].unshift({
        scopes,

        start: match.match.index + match.match[0].length,
        end: endMatch.match.index,
      });

      if (match.pattern.captures) {
        const keys = Object.keys(match.pattern.captures);
        for (let i = 0; i < keys.length; i++) {
          const capture = parseInt(keys[i]);

          begin:
          {
            let index = 0;
            for (let j = 1; j < capture; j++) if (match.match[j]) index += match.match[j].length;

            const capture_match = match.match[capture];
            if (!capture_match) break begin;


            results[0].push({
              scopes: [match.pattern.captures[capture].name, ...scopes],
              
              start: match.match.index + index,
              end: match.match.index + index + capture_match.length,
            });
          }

          end:
          {
            let index = 0;
            for (let j = 1; j < capture; j++) if (endMatch.match[j]) index += endMatch.match[j].length;

            const capture_match = endMatch.match[capture];
            if (!capture_match) break end;


            results[0].push({
              scopes: [endMatch.pattern.captures[capture].name, ...scopes],
              
              start: endMatch.match.index + index,
              end: endMatch.match.index + index + capture_match.length,
            });
          }
        }
      } else {
        if (match.pattern.beginCaptures) {
          const keys = Object.keys(match.pattern.beginCaptures);
          for (let i = 0; i < keys.length; i++) {
            const capture = parseInt(keys[i]);
  
            let index = 0;
            for (let j = 1; j < capture; j++) if (match.match[j]) index += match.match[j].length;
  
            const capture_match = match.match[capture];
            if (!capture_match) continue;
  
  
            results[0].unshift({
              scopes: [match.pattern.beginCaptures[capture].name, ...scopes],
              
              start: match.match.index + index,
              end: match.match.index + index + capture_match.length,
            });
          }
        }
        if (match.pattern.endCaptures) {
          const keys = Object.keys(match.pattern.endCaptures);
          for (let i = 0; i < keys.length; i++) {
            const capture = parseInt(keys[i]);
  
            let index = 0;
            for (let j = 1; j < capture; j++) if (endMatch.match[j]) index += endMatch.match[j].length;
  
            const capture_match = endMatch.match[capture];
            if (!capture_match) continue;
  
  
            results[0].push({
              scopes: [match.pattern.endCaptures[capture].name, ...scopes],
              
              start: endMatch.match.index + index,
              end: endMatch.match.index + index + capture_match.length,
            });
          }
        }
      }
      
      if (match.pattern.name) results[0].unshift({
        scopes: groups,
        
        start: match.match.index,
        end: endMatch.match.index + endMatch.match[0].length,
      });

      return results;
    }
    if (match.type === 'match') {
      const scopes = Array.from(groups);
      if (match.pattern.name) scopes.unshift(match.pattern.name);

      const results: LanguageResult[] = [];
      if (match.pattern.name) {
        results.push({
          scopes,
          
          start: match.match.index,
          end: match.match.index + match.match[0].length,
        });
      }
      if (match.pattern.captures) {
        const keys = Object.keys(match.pattern.captures);
        for (let i = 0; i < keys.length; i++) {
          const capture = parseInt(keys[i]);

          let index = 0;
          for (let j = 1; j < capture; j++) if (match.match[j]) index += match.match[j].length;

          const capture_match = match.match[capture];
          if (!capture_match) continue;


          results.push({
            scopes: [match.pattern.captures[capture].name, ...scopes],
            
            start: match.match.index + index,
            end: match.match.index + index + capture_match.length,
          });
        }
      }
      return [ results, index ];
    }

    return null;
  }

  private searchMatch(pattern: LanguagePattern, type: 'begin' | 'match' | 'end' , text: string, all_matches: Match[]) {
    if (!pattern[type]) return;

    const matches = text.matchAll(new RegExp(pattern[type], 'g'));
    for (const match of matches) {
      let j = all_matches.length;
      for (let i = 0; i < all_matches.length; i++) {
        if (all_matches[i].match.index < match.index) continue;
        if (all_matches[i].match.index === match.index) if (all_matches[i].match[0].length > match[0].length) continue;
        j = i;
        break;
      }
      all_matches.splice(j, 0, { pattern, type, match });
    }
  }
}