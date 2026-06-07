class GotoGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, targetLabelGuid }) {
    super({ guid, type: 'goto', parentNodeGuid });
    this.targetLabelGuid = targetLabelGuid;
  }
}

globalThis.GotoGlyph = GotoGlyph;
