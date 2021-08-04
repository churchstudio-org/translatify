import { Tokenizer } from "./tokenizer";
import { Language, ParallelCorpus, PredictionOptions, Prediction } from "./types";

export class Translatify {
    corpus: ParallelCorpus = {};

    add(language: Language, corpus: string[]) {
        this.corpus[language] = corpus;
    }

    remove(language: Language) {
        delete this.corpus[language];
    }

    clear() {
        this.corpus = {};
    }

    predict(
        input: string[],
        inputLanguage: Language,
        outputLanguage: Language,
        { output, similarity, verbose }: PredictionOptions = {}
    ): Prediction {
        var match: any[] = [];

        var from = this.corpus[inputLanguage]!
            .map((e: string) => Tokenizer.words(e.toLowerCase(), inputLanguage));

        var to = this.corpus[outputLanguage]!
            .map((e: string) =>  Tokenizer.words(e.toLowerCase(), outputLanguage));

        input = input
            .map(e => Tokenizer.clean(e).toLowerCase().trim());

        if (similarity == 'input' || similarity == 'both') {
            input = []
                .concat
                .apply([], input
                    .map(e => Tokenizer
                        .similar(e, []
                            .concat
                            .apply([], from as any[]))) as any[])
                .filter((v, i, a) => a.indexOf(v) === i);
        }

        var occurrences = from
            .map((e, i) => e.some(x => input.includes(x)) ? i : -1)
            .filter(e => e >= 0);

        verbose && console.log('[Translatify]', `'${input[0]}' was found ${occurrences.length} times`);

        var includes = to
            .filter((_, i) => occurrences.includes(i))
            .map(e => e
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(' '))
            .join(' ')
            .split(' ')
            .reduce((includes: any, word) => {
                includes[word] = ++includes[word] || 1;
                return includes;
            }, {});

        includes = Object.keys(includes)
            .filter(e => !output || output.includes(e))
            .map(e => [e, includes[e]])
            .reduce((includes: any, [key, value]) => {
                includes[key] = value;
                return includes;
            }, {});

        verbose && console.log('[Translatify]', 'includes', includes);

        var excludes = to
            .filter((_, i) => !occurrences.includes(i))
            .map(e => e
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(' '))
            .join(' ')
            .split(' ')
            .reduce((excludes: any, word) => {
                excludes[word] = ++excludes[word] || 1;
                return excludes;
            }, {});

        excludes = Object.keys(excludes)
            .filter(e => includes[e] && (!output || output.includes(e)))
            .map(e => [e, excludes[e]])
            .reduce((excludes: any, [key, value]) => {
                excludes[key] = value;
                return excludes;
            }, {});

        verbose && console.log('[Translatify]', 'excludes', excludes);

        var threshold = Object
            .keys(includes)
            .filter(e => !output || output.includes(e))
            .filter(e => !excludes[e] || excludes[e] / to.length <= 0.25)
            .map(e => includes[e])
            .reduce((a, b) => a + b, 0);

        verbose && console.log('[Translatify]', 'threshold', threshold);

        var result = Object.keys(includes)
            .filter(e => !output ? includes[e] / occurrences.length >= 0.15 : includes[e] / threshold >= 0.12)
            .filter(e => !excludes[e] || excludes[e] / to.length <= 0.25)
            .filter(e => !excludes[e] || excludes[e] < occurrences.length * 20)
            .filter(e => !excludes[e] || includes[e] / excludes[e] >= 0.2)
            .map(e => [e, includes[e] - (excludes[e] ?? 0)])
            .reduce((result: any, [key, value]) => {
                result[key] = value;
                return result;
            }, {});
            

        verbose && console.log('[Translatify]', 'result', result);

        if (Object.keys(result).length) {
            var closest = Object.values(result).reduce((a: any, b: any) => {
                return Math.abs(b - occurrences.length) < Math.abs(a - occurrences.length) ? b : a;
            });

            match = Object
                .keys(result)
                .filter(e => result[e] == closest);

            if (similarity == 'output' || similarity == 'both') {
                match = []
                    .concat
                    .apply([], match
                    .map(e => Tokenizer
                        .similar(e, []
                            .concat
                            .apply([], to as any[]))) as any[]);
            }

            verbose && console.log('[Translatify]', `'${input[0]}':`, match);
        } else {
            verbose && console.log('[Translatify]', `'${input[0]}':`, input[0].split('').map(_ => '?').join(''));
        }

        return {
            input: input,
            output: match,
            inputLanguage: inputLanguage,
            outputLanguage: outputLanguage,
        };
    }
}