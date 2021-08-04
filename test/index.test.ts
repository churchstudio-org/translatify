import { expect } from "chai";
import { promises as fs } from "fs";
import _ from "lodash";
import { describe, run } from "mocha";
import { Tokenizer } from "../src/tokenizer";
import { Translatify } from '../src/translatify';
import { Language } from "../src/types";

(async () => {
    var tests: [[Language, Language]] = [
        ['en', 'pt'],
    ];
    
    for (var [inputLanguage, outputLanguage] of tests) {
        console.log(`${inputLanguage} x ${outputLanguage}`);

        var translatify = new Translatify();

        // Load parallel corpus
        var corpus = await fs.readFile(`./assets/${inputLanguage}-${outputLanguage}.corpus.txt`, 'utf8');
    
        translatify.add(inputLanguage, corpus
            .split('\n')
            .map(e => e.split('\t')[0])
            .filter(e => e));

        translatify.add(outputLanguage, corpus
            .split('\n')
            .map(e => e.split('\t')[1])
            .filter(e => e));

        console.log('Parallel corpus loaded');

        // Load dictionary
        var dict = await fs.readFile(`./assets/${inputLanguage}-${outputLanguage}.dict.txt`, 'utf8');

        var words = dict
            .split('\n')
            .filter(e => !e.startsWith('#'))
            // .filter(e => e.match(/^([^\s]*)\s\{.*?\}.*?::\s([^\s]*)/))
            // .map(e => e.replace(/^([^\s]*)\s\{.*?\}.*?::\s([^\s]*)/, '$1 $2'))
            // .map(e => e.split(' ').slice(0, 2))
            // .map(([word, translation]) => [word, translation.replace(/[\r,]/g, '')])
            // .map(([word, translation]) => [word.toLowerCase(), translation.toLowerCase()])
            // .filter(([word, translation]) => word && translation)
            .map(e => e.toLowerCase())
            .map(e => e.replace(/(\s|\{.*?\}|\(.*?\)|:(?!:)|,|\[.*?\])/g, '.'))
            .map(e => e.replace(/\.+/g, '.'))
            .map(e => e.split('.'))
            .filter(e => !e.includes('SEE'))
            .filter(e => e.indexOf(':') == 1)
            .map(e => e.filter(x => x && x != ':'))
            .reduce((a, v: string[]) => {
                a[v[0]] = [...a[v[0]] ?? [], ...v.slice(1)];
                return a;
            }, {} as any);

        // var translate = Object
        //     .keys(words)
        //     .map((_, i, a, j = ~~(Math.random() * (a.length - i) + i)) => ([a[i], a[j]] = [a[j], a[i]], a[i]))
        //     .slice(0, 50);

        var translate = _
            .uniq(_
                .flatten(translatify
                    .corpus[inputLanguage]!
                    .map(e => Tokenizer.words(e, inputLanguage))))
            .map(e => e.toLowerCase())
            .filter(e => words[e])
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)
            .slice(0, 1000);

        console.log('Dictionary loaded');

        describe(`Translatify`, () => {
            translate.forEach(word => {
                it(`Translate ${word} to ${words[word]}`, () => {
                    var prediction = translatify.predict([word], inputLanguage, outputLanguage);
                    expect(prediction.output).to.deep.contains.oneOf(words[word]);
                }).timeout(5000);
            });
        });
    }

    run();
})();