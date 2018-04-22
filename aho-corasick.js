const bytebuffer = require('bytebuffer');
const _ = require('lodash');

// doubleArray
// base[current] + code = next
// check[next] = current

const longtext = 'abcdecxxxxefghbテスト。bb';
const keywords = ['ab', 'テスト', 'efgh', 'bc', 'c', 'ac', 'adeg', 'abcdefg'];

const calcBase = (da, index, children) => {
  let base = 1;
  if (index - children[0].code > base) {
    base = (index - children[0].code) + 1;
  }
  for (;;) {
    let used = false;
    for (let i = 0; i < children.length; i++) {
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

const debugTrie = (baseTrie, s = '') => {
  const children = baseTrie.children;
  baseTrie.children = _.map(baseTrie.children, c => c.code);
  let link = baseTrie.failurelink;
  if (!link) {
    link = { index: 0 };
  }
  let output = baseTrie.output;
  if (!output) {
    output = { index: 0 };
  }
  console.log(s, { index: baseTrie.index, code: String.fromCharCode(baseTrie.code), output: output.index, link: link.index, p: baseTrie.pattern });
  _.forEach(children, (child) => {
    debugTrie(child, s + '    |');
  });
};

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

const initAC = () => ({
  base: [],
  check: [],
  failurelink: [],
  output: [],
  codemap: [],
});

// DFS
const buildDoubleArray2 = (currentIndex, baseTrie, doubleArray) => {
  baseTrie.index = currentIndex;
  if (baseTrie.code) {
    doubleArray.codemap[currentIndex] = baseTrie.code;
  }
  if (_.isEmpty(baseTrie.children)) {
    return;
  }
  const v = calcBase(doubleArray, currentIndex, baseTrie.children);
  if (baseTrie.pattern) {
    doubleArray.base[currentIndex] = -v;
  } else {
    doubleArray.base[currentIndex] = v;
  }
  // set check
  _.forEach(baseTrie.children, (child) => {
    const nextState = v + child.code;
    doubleArray.check[nextState] = currentIndex;
  });
  _.forEach(baseTrie.children, (child) => {
    const nextState = v + child.code;
    buildDoubleArray(nextState, child, doubleArray);
  });
};

const buildDoubleArray = (rootIndex, baseTrie, doubleArray) => {
  const stack = [{ state: baseTrie, index: rootIndex }];
  while (!_.isEmpty(stack)) {
    const { state, index } = stack.pop();
    state.index = index;
    if (state.code) {
      doubleArray.codemap[index] = state.code;
    }
    if (!_.isEmpty(state.children)) {
      const v = calcBase(doubleArray, index, state.children);
      if (state.pattern) {
        doubleArray.base[index] = -v;
      } else {
        doubleArray.base[index] = v;
      }
      // set check
      _.forEach(state.children, (child) => {
        const nextState = v + child.code;
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

const getNextIndex = (ac, currentIndex, code) => {
  const nextIndex = getBase(ac, currentIndex) + code;
  if (ac.check[nextIndex] === currentIndex) {
    return nextIndex;
  }
  if (!nextIndex) {
    const rootIndex = 1;
    const nextIndexAfterRoot = getBase(ac, rootIndex) + code;
    if (ac.check[nextIndexAfterRoot] === rootIndex) {
      return nextIndexAfterRoot;
    }
  }
  if (currentIndex === 1) {
    return 1;
  }
  return ac.failurelink[currentIndex];
};

const getPattern = (ac, index) => {
  const root = 1;
  if (index <= root) {
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

const search = (ac, text) => {
  const codes = bytebuffer.fromUTF8(text).toBuffer();
  let currentIndex = 1;
  _.forEach(codes, (code) => {
    const nextIndex = getNextIndex(ac, currentIndex, code);
    if (ac.base[nextIndex] < 0 || !ac.base[nextIndex]) {
      const pattern = Int8Array.from(getPattern(ac, nextIndex));
      const b = bytebuffer.wrap(pattern.buffer);
      console.log(b.toUTF8());
    }
    const outputs = getOutputs(ac, nextIndex);
    _.forEach(outputs, (output) => {
      const pattern = Int8Array.from(output);
      const b = bytebuffer.wrap(pattern.buffer);
      console.log(b.toUTF8());
    });
    currentIndex = nextIndex;
  });
};

const keys = keywords.map(k => bytebuffer.fromUTF8(k).toBuffer()).sort();
// console.log(_.map(keys, k => Int32Array.from(k)));
const baseTrie = buildBaseTrie(keys);
// debugTrie(baseTrie);
const ac = initAC();
buildDoubleArray(1, baseTrie, ac);
buildAC(baseTrie, ac);
debugTrie(baseTrie);
search(ac, longtext);

// console.log(ac);
// debugTrie(baseTrie);
