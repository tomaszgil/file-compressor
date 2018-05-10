const Compressor = require('./Compressor');

const fileName = 'data/norm_wiki_sample.txt';
const encodedName = 'encoded';
const codeName = 'code';
const outputName = 'output.txt';

const c = new Compressor();
c.create(fileName);
c.encode(fileName);
c.save(encodedName, codeName);

c.load(encodedName, codeName);
c.decode(outputName);