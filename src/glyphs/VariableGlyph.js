class VariableGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name, value }) {
    super({ guid, type: 'variable', parentNodeGuid });
    this.name = name;
    this.value = value;
  }
}

globalThis.VariableGlyph = VariableGlyph;
