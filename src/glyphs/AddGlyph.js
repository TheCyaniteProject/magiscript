class AddGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, operand }) {
    super({ guid, type: 'add', parentNodeGuid });
    this.operand = operand;
  }
}

globalThis.AddGlyph = AddGlyph;
