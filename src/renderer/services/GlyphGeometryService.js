class GlyphGeometryService {
  static getDiamondBoundaryDistance(radius, unitX, unitY) {
    const divisor = Math.abs(unitX) + Math.abs(unitY) || 1;
    return radius / divisor;
  }

  static getGlyphBoundaryDistance(glyph, unitX, unitY) {
    if (glyph.type === 'start' || glyph.type === 'value') {
      return GlyphGeometryService.getDiamondBoundaryDistance(glyph.radius, unitX, unitY);
    }

    return glyph.radius;
  }

  static getGlyphOuterRadius(glyph, unitX, unitY) {
    return GlyphGeometryService.getGlyphBoundaryDistance(glyph, unitX, unitY) + glyph.lineWidth / 2;
  }

  static isPointInsideTriangleGlyph(glyph, worldX, worldY) {
    const localX = worldX - glyph.x;
    const localY = worldY - glyph.y;
    if (localY < -glyph.radius || localY > glyph.radius * 0.9) {
      return false;
    }

    const normalizedY = (localY + glyph.radius) / (glyph.radius * 1.9);
    const halfWidth = glyph.radius * (0.08 + normalizedY * 0.84);
    return Math.abs(localX) <= halfWidth;
  }

  static isPointInsideDiamondGlyph(glyph, worldX, worldY) {
    const localX = Math.abs(worldX - glyph.x);
    const localY = Math.abs(worldY - glyph.y);
    return (localX + localY) <= glyph.radius;
  }

  static isPointInsideOctagonGlyph(glyph, worldX, worldY) {
    const localX = Math.abs(worldX - glyph.x);
    const localY = Math.abs(worldY - glyph.y);
    const r = glyph.radius;
    return localX <= r && localY <= r && localX + localY <= r * 1.62;
  }
}

globalThis.GlyphGeometryService = GlyphGeometryService;
