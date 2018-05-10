const fs = require('fs');
const BitArray  = require('./BitArray');

class Compressor {
  constructor() {
    this._code = {};
    this._bytes = null;
  }

  create(inputFile) {
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

    const keys = Object.keys(frequency);
    this._code = Object.defineProperty({}, 'size', {
      value: Math.ceil(Math.log(keys.length) / Math.log(2)),
      enumerable: false
    });

    const sortedFrequency = keys
      .map(key => ({
        char: key,
        frequency: frequency[key]
      }))
      .sort((a, b) => {
        if (a.frequency > b.frequency) return -1;
        if (a.frequency === b.frequency) return 0;
        if (a.frequency < b.frequency) return 1;
      });

    sortedFrequency.forEach((el, index) => {
      this._code[el.char] = new BitArray(this._code.size, index);
    });
  }

  encode(fileName) {
    const inputChars = fs
      .readFileSync(fileName, 'utf8')
      .split('\n')[0]
      .split('');

    const data = inputChars
      .map(char => this._code[char].toString())
      .join("");

    const bytesNum = Math.ceil(data.length / 8) + 1;
    this._bytes = new Uint8Array(bytesNum);
    const tailLength = data.length % 8;

    let i = 0, j = 0;
    this._bytes[j++] = tailLength;

    for (; i < data.length && j < bytesNum; i += 8, j++) {
      const chunk = data.slice(i, i + 8);
      this._bytes[j] = new BitArray(8, chunk).toNumber();
    }

    if (tailLength) {
      const chunk = data.slice(i, i + tailLength);
      this._bytes[j] = new BitArray(tailLength, chunk).toNumber();
    }

    console.log('Successfully encoded!\n');
  }

  decode(outputName) {
    console.log("Decoding...\n");
    const tailLength = this._bytes[0];
    let data = '';
    let decoded = '';

    let endPoint = tailLength ? this._bytes.length - 1 : this._bytes.length;

    for (let i = 1; i < endPoint; i++) {
      data += new BitArray(8, this._bytes[i]).toString();
    }

    if (tailLength) {
      data += new BitArray(tailLength, this._bytes[this._bytes.length - 1]).toString();
    }

    const reversedCode = {};
    for (let key in this._code) {
      if (this._code.hasOwnProperty(key)) {
        const value = this._code[key].toString();
        reversedCode[value] = key;
      }
    }

    for (let i = 0; i < data.length; i += this._code.size) {
      const chunk = data.slice(i, i + this._code.size);
      if (reversedCode.hasOwnProperty(chunk)) {
        decoded += reversedCode[chunk];
      }
    }

    fs.writeFileSync(outputName, decoded);
    console.log(`Decoded text fragment: \n${decoded.slice(0, 300)}...`);
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