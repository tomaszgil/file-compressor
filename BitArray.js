class BitArray {
  constructor(size, bits) {
    this._bits = [];

    if (typeof bits === 'string') {
      for (let bit of bits.split('').reverse()) {
        this._bits.push(bit === '1' ? BitArray._ON : BitArray._OFF);
      }
    } else if (!isNaN(bits)) {
      for (let bit of bits.toString(2).split('').reverse()) {
        this._bits.push(bit === '1' ? BitArray._ON : BitArray._OFF);
      }
    }

    let i = size - this._bits.length;
    while (i-- > 0) this._bits.push(BitArray._OFF);
  }

  toString() {
    return [...this._bits].reverse().map(bit => bit === BitArray._ON ? '1' : '0').join('');
  }

  toNumber() {
    return parseInt([...this._bits].reverse().join(''), 2);
  }
}

BitArray._ON = 1;
BitArray._OFF = 0;

module.exports = BitArray;