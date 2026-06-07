class SetValueGlyph extends Glyph {
  constructor({ guid, parentNodeGuid }) {
    super({ guid, type: 'setvalue', parentNodeGuid });
  }
}

globalThis.SetValueGlyph = SetValueGlyph;
