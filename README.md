aho-corasick-node
====

A Node implementation of the Aho-Corasick string matching algorithm based on DoubleArray Trie.

## Install

```
npm install aho-corasick-node --save
```

## Usage

### Build
```
const AhoCorasick = require('aho-corasick-node');

const keywords = ['b', 'ba', 'nan', 'ab'];
const builder = AhoCorasick.builder();
keywords.forEach(k => builder.add(k));
const ac = builder.build();
```

### Match

```
const text = 'banana';
const hits = ac.match(text); // ['b', 'ba', 'nan']
```

### Export

```
const buf = ac.export();
// content of buf:
// {
//   base: string...,
//   check: string...,
//   failurelink: string...,
//   output: string...,
//   codemap: string...,
// };
```

### Load

```
const loadedAC = AhoCorasick.from(buf);
const hits = loadedAC.match(text); // ['b', 'ba', 'nan']
```

## Licence

[MIT](https://opensource.org/licenses/MIT)
