const fs = require('fs');
const BitArray = require('./BitArray');
const Compressor = require('./Compressor');

class HuffmanCompressor extends Compressor {
  constructor() {
    super();
  }

  _createCode(sortedFrequency) {
    while (sortedFrequency.length > 1) {
      const first = sortedFrequency.pop();
      const second = sortedFrequency.pop();
      const combined = {
        char: '',
        frequency: first.frequency + second.frequency,
        '0': first,
        '1': second
      };

      sortedFrequency.push(combined);
      sortedFrequency.sort(Compressor._frequencySortCriteria);
    }

    const processNode = (node, code) => {
      if (node['0']) {
        processNode(node['0'], code + '0');
      }
      if (node['1']) {
        processNode(node['1'], code + '1');
      }
      if (node.char) {
        this._code[node.char] = new BitArray(code.length, code);
      }
    };

    const huffmanTree = sortedFrequency[0];
    processNode(huffmanTree, '');
  }

  _decodeBinaryString(data, reversedCode) {
    let decoded = '';
    let i = 0, j = 1;

    while (i < data.length && j <= data.length) {
      const chunk = data.substring(i, j);
      if (reversedCode.hasOwnProperty(chunk)) {
        decoded += reversedCode[chunk];
        i = j;
      }
      j++;
    }

    return decoded;
  }

  _saveCode(fileName) {
    let content = '';
    for (let key in this._code) {
      content += `${key}:${this._code[key].toString()}\n`;
    }

    fs.writeFileSync(fileName, content);
  }
}

module.exports = HuffmanCompressor;