class GraphQueryService {
  static findNodeByGuid(targetGuid, nodes, isNode) {
    for (const node of nodes) {
      if (node.guid === targetGuid) {
        return node;
      }

      const nestedNodes = node.glyphs.filter(isNode);
      const nestedMatch = GraphQueryService.findNodeByGuid(targetGuid, nestedNodes, isNode);
      if (nestedMatch) {
        return nestedMatch;
      }
    }

    return null;
  }

  static findGlyphByGuid(targetGuid, nodes, isNode) {
    for (const node of nodes) {
      if (node.startGlyph.guid === targetGuid) {
        return node.startGlyph;
      }

      for (const glyph of [...node.outerGlyphs, ...node.glyphs]) {
        if (glyph.guid === targetGuid) {
          return glyph;
        }

        if (isNode(glyph)) {
          const nestedGlyph = GraphQueryService.findGlyphByGuid(targetGuid, [glyph], isNode);
          if (nestedGlyph) {
            return nestedGlyph;
          }
        }
      }
    }

    return null;
  }

  static collectVariableGlyphs(nodes, isNode, results = []) {
    nodes.forEach((node) => {
      node.outerGlyphs.forEach((glyph) => {
        if (glyph.type === 'variable') {
          results.push(glyph);
        }
      });

      node.glyphs.forEach((glyph) => {
        if (glyph.type === 'variable') {
          results.push(glyph);
        }

        if (isNode(glyph)) {
          GraphQueryService.collectVariableGlyphs([glyph], isNode, results);
        }
      });
    });

    return results;
  }

  static collectLabelGlyphs(nodes, isNode, results = []) {
    nodes.forEach((node) => {
      if (node.startGlyph) {
        results.push(node.startGlyph);
      }

      node.glyphs.forEach((glyph) => {
        if (glyph.type === 'label') {
          results.push(glyph);
        }

        if (isNode(glyph)) {
          GraphQueryService.collectLabelGlyphs([glyph], isNode, results);
        }
      });
    });

    return results;
  }

  static collectReferenceableGlyphs(nodes, isNode, isOwnedBooleanGlyph, results = []) {
    nodes.forEach((node) => {
      node.outerGlyphs.forEach((glyph) => {
        if (glyph.type === 'variable' || glyph.type === 'boolean') {
          results.push(glyph);
        }
      });

      node.glyphs.forEach((glyph) => {
        if (glyph.type === 'variable' || (glyph.type === 'boolean' && !isOwnedBooleanGlyph(glyph))) {
          results.push(glyph);
        }

        if (isNode(glyph)) {
          GraphQueryService.collectReferenceableGlyphs([glyph], isNode, isOwnedBooleanGlyph, results);
        }
      });
    });

    return results;
  }
}

globalThis.GraphQueryService = GraphQueryService;
