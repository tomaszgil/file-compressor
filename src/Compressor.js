const fs = require('fs');
const BitArray  = require('./BitArray');

class Compressor {
  constructor() {
    this._code = {};
    this._bytes = null;
    this._reverseWithNumbers = false;
  }

  create(inputFile) {
    const frequency = this._getFrequency(inputFile);
    const codeSize = Math.ceil(Math.log(frequency.length) / Math.log(2));
    this._createCode(frequency, codeSize);
  }

  _getFrequency(inputFile) {
    const input = fs
      .readFileSync(inputFile, 'utf8')
      .split('\n')[0];
    const chars = input.split('');
    const frequency = {};

    chars.forEach(c => {
      if (!frequency[c]) {
        frequency[c] = 1;
      } else {
        frequency[c]++;
      }
    });

    return Object
      .keys(frequency)
      .map(key => ({
        char: key,
        frequency: frequency[key]
      }))
      .sort(Compressor._frequencySortCriteria);
  }

  static _frequencySortCriteria(a, b) {
    if (a.frequency > b.frequency) return -1;
    if (a.frequency === b.frequency) return 0;
    if (a.frequency < b.frequency) return 1;
  }

  _createCode(sortedFrequency, codeSize) {
    this._code = Object.defineProperty({}, 'size', {
      value: codeSize,
      enumerable: false
    });

    sortedFrequency.forEach((el, index) => {
      this._code[el.char] = new BitArray(this._code.size, index);
    });
  }

  encode(fileName) {
    const data = this._createBinaryString(fileName);
    this._bytes = Compressor._createBytes(data);
    console.log('Successfully encoded!\n');
  }

  static _createBytes(data) {
    const bytesNum = Math.ceil(data.length / 8) + 1;
    const bytes = new Uint8Array(bytesNum);
    const tailLength = data.length % 8;

    let i = 0, j = 0;
    bytes[j++] = tailLength;

    for (; i < data.length && j < bytesNum; i += 8, j++) {
      const chunk = data.slice(i, i + 8);
      bytes[j] = new BitArray(8, chunk).toNumber();
    }

    if (tailLength) {
      const chunk = data.slice(i, i + tailLength);
      bytes[j] = new BitArray(tailLength, chunk).toNumber();
    }

    return bytes;
  }

  _createBinaryString(fileName) {
    const inputChars = fs
      .readFileSync(fileName, 'utf8')
      .split('\n')[0]
      .split('');

    return inputChars
      .map(char => this._code[char].toString())
      .join("");
  }

  decode(outputName) {
    console.log("Decoding...");
    const data = this._resolveBytes();
    const reversedCode = {};

    let keyFunction;
    if (this._reverseWithNumbers) {
      keyFunction = el => el.toNumber();
    } else {
      keyFunction = el => el.toString();
    }

    for (let key in this._code) {
      if (this._code.hasOwnProperty(key)) {
        const value = keyFunction(this._code[key]);
        reversedCode[value] = key;
      }
    }

    const decoded = this._decodeBinaryString(data, reversedCode);
    fs.writeFileSync(outputName, decoded);
    console.log(`Decoded text fragment: \n${decoded.slice(0, 300)}${decoded.length > 300 ? '...' : ''}`);
  }

  _resolveBytes() {
    const tailLength = this._bytes[0];
    let data = '';
    let endPoint = tailLength ? this._bytes.length - 1 : this._bytes.length;

    for (let i = 1; i < endPoint; i++) {
      data += new BitArray(8, this._bytes[i]).toString();
    }

    if (tailLength) {
      data += new BitArray(tailLength, this._bytes[this._bytes.length - 1]).toString();
    }

    return data;
  }

  _decodeBinaryString(data, reversedCode) {
    let decoded = '';
    for (let i = 0; i < data.length; i += this._code.size) {
      const chunk = data.slice(i, i + this._code.size);
      if (reversedCode.hasOwnProperty(chunk)) {
        decoded += reversedCode[chunk];
      }
    }

    return decoded;
  }

  save(fileName, codeFileName) {
    console.log("Saving files...");
    this._saveCode(codeFileName);
    this._saveEncoded(fileName);
    console.log(`Encoded file: ${fileName}`);
    console.log(`Code file: ${codeFileName}\n`);
  }

  load(encodedFileName, codeFileName) {
    console.log("Loading files...");
    this._loadCode(codeFileName);
    this._loadEncoded(encodedFileName);
    console.log("Files loaded.\n");
  }

  _saveCode(fileName) {
    let content = `size:${this._code.size}\n`;
    for (let key in this._code) {
      content += `${key}:${this._code[key].toString()}\n`;
    }

    fs.writeFileSync(fileName, content);
  }

  _saveEncoded(fileName) {
    fs.writeFileSync(fileName, new Buffer(this._bytes));
  }

  _loadCode(fileName) {
    const input = fs.readFileSync(fileName, 'utf8').split('\n');

    for (let line of input) {
      if (line) {
        let [key, value] = line.split(':');
        if (key === 'size') {
          this._code = Object.defineProperty({}, 'size', {
            value: parseInt(value),
            enumerable: false
          });
        } else {
          this._code[key] = new BitArray(this._code.size, value);
        }
      }
    }
  }

  _loadEncoded(fileName) {
    const chunkSize = 1024 * 1024; // 1 Mb
    const fd = fs.openSync(fileName, 'r+');
    let bytesRead = 0;
    let currentByte = 0;
    let bytes = [];

    do {
      try {
        const buffer = new Uint8Array(chunkSize);
        bytesRead = fs.readSync(fd, buffer, 0, chunkSize);
        currentByte += bytesRead;
        bytes = [...bytes, ...buffer.slice(0, bytesRead)];
      } catch (e) {
        console.error(e);
        break;
      }
    } while (bytesRead === chunkSize);

    this._bytes = bytes;
  }
}

module.exports = Compressor;