class ValueGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name, inputIndex }) {
    super({ guid, type: 'value', parentNodeGuid });
    this.name = name;
    this.inputIndex = inputIndex;
  }
}

globalThis.ValueGlyph = ValueGlyph;
