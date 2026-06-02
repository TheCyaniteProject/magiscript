class BooleanGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, operation = 'less', checked = false, ownerIfGlyphGuid = null }) {
    super({ guid, type: 'boolean', parentNodeGuid });
    this.operation = operation;
    this.checked = Boolean(checked);
    this.lastResult = this.checked ? 1 : 0;
    this.ownerIfGlyphGuid = ownerIfGlyphGuid;
  }
}

globalThis.BooleanGlyph = BooleanGlyph;