const fs = require('fs');
const BitArray = require('./BitArray');
const Compressor = require('./Compressor');

class LZWCompressor extends Compressor {
  constructor() {
    super();
    this._reverseWithNumbers = true;
  }

  _createBinaryString(fileName) {
    const inputChars = fs
      .readFileSync(fileName, 'utf8')
      .split('\n')[0]
      .split('');

    let outputString = '';
    let output = [];
    let nextCode = Object.keys(this._code).length;
    let currentSize = this._code.size;
    let current = inputChars[0];
    let next =  inputChars[1];
    let i = 1;

    // Create copy of code to prevent writing to code file longer than single character encodings
    const code = Object.assign({}, this._code);
    if (Math.pow(2, currentSize) <= nextCode) {
      currentSize++;
    }

    while (i < inputChars.length) {
      next =  inputChars[i];
      if (code.hasOwnProperty(current)) {
        if (code.hasOwnProperty(current + next)) {
          current += next;
        } else {
          output.push(code[current].toNumber());
          outputString += new BitArray(currentSize, code[current].toNumber()).toString();

          if (Math.pow(2, currentSize) <= nextCode) {
            currentSize++;
          }

          code[current + next] = new BitArray(currentSize, nextCode);
          current = next;
          nextCode++;
        }
      }

      i++;
    }

    output.push(code[current].toNumber());
    outputString += new BitArray(currentSize, code[current].toNumber()).toString();

    return outputString;
  }

  _decodeBinaryString(data, reversedCode) {
    let outputString = '';
    let nextCode = Object.keys(this._code).length;
    let currentSize = this._code.size;
    let conjecture = '';
    let i = 0;

    while (i < data.length) {
      let decodedString = '';

      const input =  data.substring(i, i + currentSize);
      const inputNumber = new BitArray(currentSize, input).toNumber().toString();

      if (reversedCode.hasOwnProperty(inputNumber)) {
        decodedString = reversedCode[inputNumber];

        if (conjecture !== '') {
          reversedCode[nextCode] = conjecture + decodedString[0];
          nextCode++;
        }
      } else {
        decodedString = conjecture + conjecture[0];
        reversedCode[nextCode] = decodedString;
        nextCode++;
      }

      outputString += decodedString;
      conjecture = decodedString;
      i += currentSize;

      if (Math.pow(2, currentSize) <= nextCode) {
        currentSize++;
      }
    }

    return outputString;
  }
}

module.exports = LZWCompressor;