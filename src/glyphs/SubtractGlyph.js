class SubtractGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, operand }) {
    super({ guid, type: 'subtract', parentNodeGuid });
    this.operand = operand;
  }
}

globalThis.SubtractGlyph = SubtractGlyph;
