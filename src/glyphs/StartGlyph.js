class StartGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name }) {
    super({ guid, type: 'start', parentNodeGuid });
    this.name = name;
  }

  getBoundaryDistance(unitX, unitY) {
    const divisor = Math.abs(unitX) + Math.abs(unitY) || 1;
    return this.radius / divisor;
  }
}

globalThis.StartGlyph = StartGlyph;
