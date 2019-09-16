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
});

const calcBase = (da, start, children) => {
  let base = Math.max(1, start) - children[0].code;
  if (base < 1) {
    base = 1;
  }
  let end = start;
  let numNotAvailable = 0;
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
      if (da.check[end]) {
        numNotAvailable += 1;
      }
      end += 1;
      base += 1;
    } else {
      break;
    }
  }
  if (numNotAvailable / (end - start) > 0.95) {
    return { base, nextCheck: end };
  }
  return { base, nextCheck: start };
};

const sortedChildrenIndex = (children, code) => {
  const index = _.sortedIndexBy(children, { code }, 'code');
  if (index >= children.length) {
    return -1;
  }
  const res = children[index];
  if (res.code === code) {
    return index;
  }
  return -1;
};

const searchChildren = (state, code) => {
  const index = sortedChildrenIndex(state.children, code);
  if (index === -1) {
    return null;
  }
  return state.children[index];
};

const isRoot = baseTrie => !baseTrie.code;

const buildBaseTrie = (sortedKeys) => {
  const root = { children: [] };
  sortedKeys.forEach((codes) => {
    let current = root;
    codes.forEach((code, i) => {
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
  // eslint-disable-next-line no-param-reassign
  doubleArray.base[1] = 1;
  const stack = [{ state: baseTrie, index: rootIndex }];
  let nextCheckIndex = 0;
  while (!_.isEmpty(stack)) {
    const { state, index } = stack.pop();
    state.index = index;
    if (!_.isEmpty(state.children)) {
      const { base, nextCheck } = calcBase(doubleArray, nextCheckIndex, state.children);
      nextCheckIndex = nextCheck;
      if (state.pattern) {
        // eslint-disable-next-line no-param-reassign
        doubleArray.base[index] = -base;
      } else {
        // eslint-disable-next-line no-param-reassign
        doubleArray.base[index] = base;
      }
      // set check
      state.children.forEach((child) => {
        const nextState = base + child.code;
        // eslint-disable-next-line no-param-reassign
        doubleArray.check[nextState] = index;
        stack.push({ state: child, index: nextState });
      });
    }
  }
};

const findFailureLink = (currentState, code) => {
  const link = currentState.failurelink;
  const index = sortedChildrenIndex(link.children, code);
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
  baseTrie.children.forEach((child) => {
    child.failurelink = baseTrie;
    ac.failurelink[child.index] = baseTrie.index;
    queue.push(child);
  });
  let i = 0;
  while (i < queue.length) {
    const current = queue[i];
    i += 1;
    current.children.forEach((child) => {
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
  const code = index - getBase(ac, ac.check[index]);
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

  codes.forEach((code) => {
    let nextState = getBase(ac, currentState) + code;
    if (!nextState || ac.check[nextState] !== currentState) {
      nextState = getNextIndexByFalure(ac, currentState, code);
    }

    if (ac.base[nextState] < 0 || !ac.base[nextState]) {
      result.push(convert(getPattern(ac, nextState)));
    }
    if (nextState !== ROOT_INDEX) {
      const outputs = getOutputs(ac, nextState);
      outputs.forEach((output) => {
        result.push(convert(output));
      });
    }
    currentState = nextState;
  });

  return _.uniq(result).sort();
};

const arrayToInt32Array = (arr) => {
  const int32Array = new Int32Array(arr.length);
  arr.forEach((v, i) => {
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
});

const exportAC = ac => ({
  base: int32ArrayToHex(ac.base),
  check: int32ArrayToHex(ac.check),
  failurelink: int32ArrayToHex(ac.failurelink),
  output: int32ArrayToHex(ac.output),
});

const importAC = ({
  base,
  check,
  failurelink,
  output,
}) => ({
  base: hexToInt32Array(base),
  check: hexToInt32Array(check),
  failurelink: hexToInt32Array(failurelink),
  output: hexToInt32Array(output),
});

class Builder {
  constructor() {
    this.words = [];
  }

  add(word) {
    this.words.push(word);
  }

  build() {
    const keys = this.words.sort().map(k => bytebuffer.fromUTF8(k).toBuffer());
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
