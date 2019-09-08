const bytebuffer = require('bytebuffer');
const _ = require('lodash');

// doubleArray
// base[current] + code = next
// check[next] = current

const ROOT_INDEX = 1;

const initAC = () => ({
  base: [],
  check: [],
  failurelink: [],
  output: [],
  codemap: [],
});

const calcBase = (da, index, children) => {
  let base = 1;
  if (index - children[0].code > base) {
    base = (index - children[0].code) + 1;
  }
  for (;;) {
    let used = false;
    for (let i = 0; i < children.length; i += 1) {
      const nextState = base + children[i].code;
      if (da.check[nextState]) {
        used = true;
        break;
      }
    }
    if (used) {
      base += 1;
    } else {
      break;
    }
  }
  return base;
};

const searchChildren = (state, code) => state.children.filter(s => s.code === code)[0];

const isRoot = baseTrie => !baseTrie.code;

const buildBaseTrie = (sortedKeys) => {
  const root = { children: [] };
  _.forEach(sortedKeys, (codes) => {
    let current = root;
    _.forEach(codes, (code, i) => {
      const found = searchChildren(current, code);
      if (found) {
        current = found;
      } else {
        const state = { code, children: [] };
        current.children.push(state);
        current = state;
      }
      if (i === codes.length - 1) {
        current.pattern = true;
      }
    });
  });
  return root;
};

// DFS
const buildDoubleArray = (rootIndex, baseTrie, doubleArray) => {
  const stack = [{ state: baseTrie, index: rootIndex }];
  while (!_.isEmpty(stack)) {
    const { state, index } = stack.pop();
    state.index = index;
    if (state.code) {
      // eslint-disable-next-line no-param-reassign
      doubleArray.codemap[index] = state.code;
    }
    if (!_.isEmpty(state.children)) {
      const v = calcBase(doubleArray, index, state.children);
      if (state.pattern) {
        // eslint-disable-next-line no-param-reassign
        doubleArray.base[index] = -v;
      } else {
        // eslint-disable-next-line no-param-reassign
        doubleArray.base[index] = v;
      }
      // set check
      _.forEach(state.children, (child) => {
        const nextState = v + child.code;
        // eslint-disable-next-line no-param-reassign
        doubleArray.check[nextState] = index;
        stack.push({ state: child, index: nextState });
      });
    }
  }
};

const findFailureLink = (currentState, code) => {
  const link = currentState.failurelink;
  const index = _.findIndex(link.children, child => child.code === code);
  if (index >= 0) {
    return link.children[index];
  }
  if (isRoot(link)) {
    return link;
  }
  return findFailureLink(link, code);
};

// BFS
const buildAC = (baseTrie, ac) => {
  const queue = [];
  _.forEach(baseTrie.children, (child) => {
    child.failurelink = baseTrie;
    ac.failurelink[child.index] = baseTrie.index;
    queue.push(child);
  });
  let i = 0;
  while (i < queue.length) {
    const current = queue[i];
    i += 1;
    _.forEach(current.children, (child) => {
      // build failurelink
      const failurelink = findFailureLink(current, child.code);
      child.failurelink = failurelink;
      ac.failurelink[child.index] = failurelink.index;
      queue.push(child);

      // build output link
      if (failurelink.pattern) {
        child.output = failurelink;
      } else {
        child.output = failurelink.output;
      }
      if (child.output) {
        ac.output[child.index] = child.output.index;
      }
    });
  }
};

const getBase = (ac, index) => {
  const v = ac.base[index];
  if (v < 0) {
    return -v;
  }
  return v;
};

const getNextIndexByFalure = (ac, currentIndex, code) => {
  let failure = ac.failurelink[currentIndex];
  if (!failure || !getBase(ac, failure)) {
    failure = ROOT_INDEX;
  }
  const failureNext = getBase(ac, failure) + code;
  if (failureNext && ac.check[failureNext] === failure) {
    return failureNext;
  }
  if (currentIndex === ROOT_INDEX) {
    return ROOT_INDEX;
  }
  return getNextIndexByFalure(ac, failure, code);
};

const getPattern = (ac, index) => {
  if (index <= ROOT_INDEX) {
    return [];
  }
  const code = ac.codemap[index];
  const parent = ac.check[index];
  const res = getPattern(ac, parent);
  res.push(code);
  return res;
};

const getOutputs = (ac, index) => {
  const output = ac.output[index];
  if (output) {
    return [getPattern(ac, output)].concat(getOutputs(ac, output));
  }
  return [];
};

const convert = codes => bytebuffer.wrap(codes).toUTF8();

const search = (ac, text) => {
  const result = [];
  const codes = bytebuffer.fromUTF8(text).toBuffer();
  let currentState = ROOT_INDEX;

  _.forEach(codes, (code) => {
    let nextState = getBase(ac, currentState) + code;
    if (!nextState || ac.check[nextState] !== currentState) {
      nextState = getNextIndexByFalure(ac, currentState, code);
    }
    if (ac.base[nextState] < 0 || !ac.base[nextState]) {
      result.push(convert(getPattern(ac, nextState)));
    }
    const outputs = getOutputs(ac, nextState);
    _.forEach(outputs, (output) => {
      result.push(convert(output));
    });
    currentState = nextState;
  });

  return _.uniq(result).sort();
};

const arrayToInt32Array = (arr) => {
  const int32Array = new Int32Array(arr.length);
  _.forEach(arr, (v, i) => {
    int32Array[i] = v;
  });
  return int32Array;
};

const int32ArrayToHex = (int32Array) => {
  const b = bytebuffer.wrap(int32Array.buffer);
  return b.toHex();
};

const hexToInt32Array = (hex) => {
  const b = bytebuffer.fromHex(hex);
  return new Int32Array(b.toArrayBuffer());
};

const compactAC = ac => ({
  base: arrayToInt32Array(ac.base),
  check: arrayToInt32Array(ac.check),
  failurelink: arrayToInt32Array(ac.failurelink),
  output: arrayToInt32Array(ac.output),
  codemap: arrayToInt32Array(ac.codemap),
});

const exportAC = ac => ({
  base: int32ArrayToHex(ac.base),
  check: int32ArrayToHex(ac.check),
  failurelink: int32ArrayToHex(ac.failurelink),
  output: int32ArrayToHex(ac.output),
  codemap: int32ArrayToHex(ac.codemap),
});

const importAC = ({
  base,
  check,
  failurelink,
  output,
  codemap,
}) => ({
  base: hexToInt32Array(base),
  check: hexToInt32Array(check),
  failurelink: hexToInt32Array(failurelink),
  output: hexToInt32Array(output),
  codemap: hexToInt32Array(codemap),
});

class Builder {
  constructor() {
    this.words = [];
  }

  add(word) {
    this.words.push(word);
  }

  build() {
    const keys = this.words.map(k => bytebuffer.fromUTF8(k).toBuffer()).sort();
    const baseTrie = buildBaseTrie(keys);
    const ac = initAC();
    buildDoubleArray(ROOT_INDEX, baseTrie, ac);
    buildAC(baseTrie, ac);
    return new AhoCorasick(compactAC(ac));
  }
}

class AhoCorasick {
  constructor(data) {
    this.data = data;
  }

  match(text) {
    return search(this.data, text);
  }

  export() {
    return exportAC(this.data);
  }

  static from(buffers) {
    const ac = new AhoCorasick();
    ac.data = importAC(buffers);
    return ac;
  }

  static builder() {
    return new Builder();
  }
}

module.exports = AhoCorasick;
