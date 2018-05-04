const Compressor = require('./Compressor');

const fileName = 'data/test.txt';
const encodedName = 'encoded';
const codeName = 'code';

const c = new Compressor();
c.create(fileName);
c.encode(fileName);
c.save(encodedName, codeName);

c.load(encodedName, codeName);
c.decode();