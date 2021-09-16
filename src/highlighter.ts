import { LanguageResult } from "languageParser";

export interface Syntax {
  scopes: string[];
  value: string;
}

export function highlight(code: string, language: LanguageResult[], defaultScopes: string[]): Syntax[] {
  const result: Syntax[] = [];

  let last: LanguageResult;

  main:
  for (let i = 0; i < language.length; i++) {
    const snippet = language[i];
    const index = last?.end ?? 0;

    if (index < snippet.start) result.push({
      scopes: defaultScopes.slice(),
      value: code.substring(last?.end ?? 0, snippet.start)
    });

    for (let j = i + 1; j < language.length; j++) {
      if (language[j].start >= snippet.end) {
        const snippets = language.slice(i + 1, j);
        result.push(...highlight(code.substring(snippet.start, snippet.end), snippets, snippet.scopes));

        i = j - 1;
        last = snippet;
        continue main;
      }
    }
    
    const snippets = language.slice(i + 1);
    result.push(...highlight(code.substring(snippet.start, snippet.end), snippets, snippet.scopes));
    last = snippet;

    break;
  }

  const index = last?.end ?? 0;
  if (index < code.length) result.push({
    scopes: defaultScopes.slice(),
    value: code.substring(index, code.length)
  });

  return result;
}