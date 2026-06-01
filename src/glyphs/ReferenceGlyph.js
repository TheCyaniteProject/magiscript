class ReferenceGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, referenceGlyphGuid = null }) {
    super({ guid, type: 'reference', parentNodeGuid });
    this.referenceGlyphGuid = referenceGlyphGuid;
  }
}

globalThis.ReferenceGlyph = ReferenceGlyph;
