aho-corasick-node
====

A Node implementation of the Aho-Corasick string matching algorithm based on DoubleArray Trie.

## Install

```bash
npm install aho-corasick-node --save
```

## Usage

### Build
```js
const AhoCorasick = require('aho-corasick-node');

const keywords = ['b', 'ba', 'nan', 'ab'];
const builder = AhoCorasick.builder();
keywords.forEach(k => builder.add(k));
const ac = builder.build();
```

### Match

```js
const text = 'banana';
const hits = ac.match(text); // ['b', 'ba', 'nan']
```

### Export

```js
const buf = ac.export();
console.log(buf);
// {
//   base: 'string...',
//   check: 'string...',
//   failurelink: 'string...',
//   output: 'string...',
//   codemap: 'string...',
// };
```

### Load

```js
const loadedAC = AhoCorasick.from(buf);
const hits = loadedAC.match(text); // ['b', 'ba', 'nan']
```

## Licence

[MIT](https://opensource.org/licenses/MIT)
