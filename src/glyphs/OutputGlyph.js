class OutputGlyph extends Glyph {
  constructor({ guid, parentNodeGuid }) {
    super({ guid, type: 'output', parentNodeGuid });
  }
}

globalThis.OutputGlyph = OutputGlyph;
