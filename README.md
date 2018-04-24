aho-corasick-node
====

A Node implementation of the Aho-Corasick string matching algorithm based on DoubleArray.

## Usage

### Match

```
const AhoCorasick = require('aho-corasick-node');

const keywords = ['b', 'ba', 'nan', 'ab'];
const text = 'banana';
const ac = new AhoCorasick();
keywords.forEach(k => ac.add(k));
ac.build();
const hits = ac.match(text); // ['b', 'ba', 'nan']
```

### Load

```
const AhoCorasick = require('aho-corasick-node');

const keywords = ['b', 'ba', 'nan', 'ab'];
const text = 'banana';

const ac = new AhoCorasick();
keywords.forEach(k => ac.add(k));
ac.build();

const buf = ac.export();
// buf struct
// {
//   base: string...,
//   check: string...,
//   failurelink: string...,
//   output: string...,
//   codemap: string...,
// };

const loadedAc = AhoCorasick.from(bufs);
const hits = loadedAc.match(text); // ['b', 'ba', 'nan']
```

## Install

```
npm install aho-corasick-node --save
```

## Licence

[MIT](https://opensource.org/licenses/MIT)
