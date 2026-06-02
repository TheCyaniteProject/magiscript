class IfElseGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, mode = 'and', nextGlyphGuidFalse = null }) {
    super({ guid, type: 'ifelse', parentNodeGuid });
    this.mode = mode;
    this.nextGlyphGuidFalse = nextGlyphGuidFalse;
  }
}

globalThis.IfElseGlyph = IfElseGlyph;