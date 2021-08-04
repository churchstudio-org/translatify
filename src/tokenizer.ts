import { Language } from "./types";

export class Tokenizer {  
    static tokenify(text: string, language: Language): (string | null)[][] {
        var result: (string | null)[][] = [];

        if (language.startsWith('ko')) {
            var spacing = /[\s]/g;

            result = text
                .split(spacing)
                .map(e => [e, null]);
        } else if (language.startsWith('ja')) {
            var kanji = /[\u4e00-\u9faf]+/g;
            var punctuation = /[\u3000-\u303f]+/g;
            var alphabet = /[\u3040-\u309f]+|[\u30a0-\u30ff]+/g;
            var groups = [
                ...(text.match(kanji) ?? []),
                ...(text.match(alphabet) ?? []),
                ...(text.match(punctuation) ?? []),
            ];

            for (var i = 0; i < text.length; i++) {
                var match = groups.find(e => e[0] == text[i]);

                if (match) {
                    var next = text.substring(i + match.length, text.length);
                    var nextPunctuation = next.match(punctuation);

                    groups.splice(groups.indexOf(match), 1);

                    if (nextPunctuation && next.startsWith(nextPunctuation[0])) {
                        result.push([match, nextPunctuation[0]]);

                        groups.splice(groups.indexOf(nextPunctuation[0]), 1);
                        
                        match = match + nextPunctuation[0];
                    } else if (match.match(punctuation)) {
                        result.push([null, match]);
                    } else {
                        result.push([match, null]);
                    }
                    
                    i += match.length - 1;
                }
            }
        } else {
            var spacing = /[\s]/g;
            var punctuation = /[^a-zA-Z]$/g;
        
            result = text
                .split(spacing)
                .map(e => {
                    var punctuationCharacter = punctuation.exec(e);
                    return punctuationCharacter ? [e.substring(0, punctuationCharacter.index), punctuationCharacter[0]] : [e, null];
                });
        }
        
        return result;
    }
  
    static words(text: string, language: Language): string[] {
        return this
            .tokenify(text, language)
            .map(([word, _]) => word as string)
            .filter(word => word != null);
    }

    static clean(string: string) {
        return string.replace(/[0-9`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    }

    static similar(source: string, target: string[]): string[] {        
        return target
            .filter(e => this.similarity(source, e) >= 0.6)
            .filter((v, i, a) => a.indexOf(v) === i);
    }
    
    static similarity(a: string, b: string): number {
        var length = Math.max(a.length, b.length);
        var score = 0;

        for (var i = 0; i < a.length; i++) {
            if (i + 1 > b.length || a[i] != b[i]) {
                break;
            }

            if (a[i] == b[i]) {
                score++;
            }
        }

        return score/length;
    }
  }