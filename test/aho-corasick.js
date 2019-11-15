const assert = require('assert');
const AhoCorasick = require('../aho-corasick');

const getAc = (keywords) => {
  const builder = AhoCorasick.builder();
  keywords.forEach(k => builder.add(k));
  const ac = builder.build();
  return ac;
};

describe('AhoCorasick', () => {
  let ac = null;
  before(() => {
    const keywords = ['b', 'ab', 'ba', 'nan'];
    const builder = AhoCorasick.builder();
    keywords.forEach(k => builder.add(k));
    ac = builder.build();
  });

  describe('builder()', () => {
    it('should build AhoCorasick', () => {
      const expectedData = {
        base: Int32Array.from([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, -4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3]),
        check: Int32Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 111, 99, 98, 0, 0, 0, 0, 0, 0, 0, 0, 1, 100]),
        failurelink: Int32Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 98, 98, 99, 0, 0, 0, 0, 0, 0, 0, 0, 1, 111]),
        output: Int32Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99]),
      };
      assert.deepEqual(ac.data, expectedData);
    });
  });

  describe('match()', () => {
    it('should match keywords', () => {
      const text = 'banana';
      assert.deepEqual(ac.match(text), ['b', 'ba', 'nan']);
    });

    it('should match empty keywords', () => {
      const text = 'hello!';
      assert.deepEqual(ac.match(text), []);
    });

    it('should match all keywords', () => {
      const text = '0123456789';
      const keywords = ['234', '23456', '3456', '67', '6789', '789', '8', '89'];
      assert.deepEqual(getAc(keywords).match(text), keywords);
    });

    it('should use suffix link', () => {
      const text = 'soars';
      const keywords = ['at', 'art', 'oars', 'soar'];
      assert.deepEqual(getAc(keywords).match(text), ['oars', 'soar']);
    });

    it('should use jump suffix link', () => {
      const text = 'soarsoars';
      const keywords = ['at', 'art', 'oars', 'soar'];
      assert.deepEqual(getAc(keywords).match(text), ['oars', 'soar']);
    });

    it('should use output', () => {
      const text = 'sting';
      const keywords = ['i', 'in', 'sting', 'tin'];
      assert.deepEqual(getAc(keywords).match(text), keywords);
    });
  });
});
