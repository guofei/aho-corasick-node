aho-corasick-node
====

A Node implementation of the Aho-Corasick string matching algorithm based on DoubleArray Trie.

## Install

```
npm install aho-corasick-node --save
```

## Usage

### Match

```
const AhoCorasick = require('aho-corasick-node');

const keywords = ['b', 'ba', 'nan', 'ab'];
const text = 'banana';

// build AhoCorasick
const builder = AhoCorasick.builder();
keywords.forEach(k => builder.add(k));
const ac = builder.build();

// match
const hits = ac.match(text); // ['b', 'ba', 'nan']
```

### Load

```
const AhoCorasick = require('aho-corasick-node');

const keywords = ['b', 'ba', 'nan', 'ab'];
const text = 'banana';

const builder = AhoCorasick.builder();
keywords.forEach(k => builder.add(k));
const ac = builder.build();

const buf = ac.export();
// buf:
// {
//   base: string...,
//   check: string...,
//   failurelink: string...,
//   output: string...,
//   codemap: string...,
// };

const loadedAc = AhoCorasick.from(buf);
const hits = loadedAc.match(text); // ['b', 'ba', 'nan']
```

## Licence

[MIT](https://opensource.org/licenses/MIT)
