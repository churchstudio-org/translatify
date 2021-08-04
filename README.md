# Translatify
A translation module for parallel corpus.

## Methodology
By comparing the verses of Bible on differents languages, it's possible to observe that verses with "God" (english) will, probably, result on verses with "Deus" (portuguese), "하나님" (korean) and "神" (japanese) on these respective languages.

As this pattern repeats for many words so there is some logic to predict translations between words on these verses.

After getting regular/good accuracy on tests between english, portuguese, korean and japanese using Bible verses as source, the algorithm was tested using other sources (see `assets/*.corpus.txt`) to prove the method.

## Terminology
*Input* - Language or word that will be translated

*Output* - Translation result or target language

*Tokenizer* - Class that performs text operations to clean and discover words on a given phrase

*Parallel corpus* - Set of parallel texts translated one by one organized by language (see `assets/*.corpus.txt`)

*Dictionary* - Set of words translated to another language (see `assets/*.dict.txt`)

*Prediction* - Attempt to translate a word to another language

## Accuracy
| Input   | Output     | Predictions | Success | Fail | Accuracy | Classification |
|---------|------------|-------------|---------|------|----------|----------------|
| English | Portuguese | 1000        | 628     | 372  | 62.8%    | C+ / B-        |

## How to use
```ts
import { Translatify } from 'translatify';

var translatify = new Translatify();

translatify.add('en', ['In the beginning God created the heaven and the earth.', ...]);
translatify.add('pt', ['No princípio criou Deus os céus e a terra.', ...]);
translatify.add('ko', ['태초에 하나님이 천지를 창조하시니라', ...]);
translatify.add('ja', ['はじめに神は天と地とを創造された。', ...]);

translatify.predict(['God'], 'en', 'pt'); // returns ['Deus']
translatify.predict(['God'], 'en', 'ko', { similarity: 'output' }); // returns ['하나님이', '하나님의', '하나님과', ...]
translatify.predict(['God'], 'en', 'ja'); // returns ['神']
translatify.predict(['하나님이'], 'ko', 'en', { similarity: 'input' }); // returns ['God']
```

## Conclusion
Translatify is not ready for production, but is a good start for anyone who wants write a program to predict translations.

God bless you.