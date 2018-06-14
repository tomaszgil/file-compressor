const Compressor = require('./src/Compressor');
const HuffmanCompressor = require('./src/HuffmanCompressor');
const LZWCompressor = require('./src/LZWCompressor');

const fileName = 'data/norm_wiki_sample.txt';
const encodedName = 'encoded';
const codeName = 'code';
const outputName = 'output.txt';

const test = (c) => {
  c.create(fileName);
  c.encode(fileName);
  c.save(encodedName, codeName);
  c.load(encodedName, codeName);
  c.decode(outputName);
};

const testCompressor = () => {
  const c = new Compressor();
  test(c);
};

const testHuffmanCompressor = () => {
  const hc = new HuffmanCompressor();
  test(hc);
};

const testLZWCompressor = () => {
  const lzw = new LZWCompressor();
  test(lzw);
};

testLZWCompressor();
