const bytebuffer = require('bytebuffer');

const codes2str = codes => bytebuffer.wrap(codes).toUTF8();

const str2codes = text => bytebuffer.fromUTF8(text).toBuffer();

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

module.exports = {
  codes2str,
  str2codes,
  arrayToInt32Array,
  int32ArrayToHex,
  hexToInt32Array,
};
