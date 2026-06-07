class NodeGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, isRoot = false }) {
    super({ guid, type: 'node', parentNodeGuid });
    this.nextGlyphGuid = null;
    this.x = 0;
    this.y = 0;
    this.radius = 0;
    this.lineWidth = 0;
    this.glyphs = [];
    this.outerGlyphs = [];
    this.entryNextGuid = null;
    this.layout = null;
    this.isRoot = Boolean(isRoot);
  }
}

globalThis.NodeGlyph = NodeGlyph;
