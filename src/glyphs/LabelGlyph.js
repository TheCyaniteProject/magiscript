class LabelGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name }) {
    super({ guid, type: 'label', parentNodeGuid });
    this.name = name;
  }
}

globalThis.LabelGlyph = LabelGlyph;
