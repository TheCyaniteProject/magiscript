class StartGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name }) {
    super({ guid, type: 'start', parentNodeGuid });
    this.name = name;
  }

  getBoundaryDistance(unitX, unitY) {
    const divisor = Math.abs(unitX) + Math.abs(unitY) || 1;
    return this.radius / divisor;
  }

  getDisplayName() {
    return this.name?.trim() || 'start';
  }

  getJumpTargetLabel() {
    return this.getDisplayName();
  }

  isClickable() {
    return true;
  }

  getEditSchema() {
    return {
      title: 'Edit Start',
      fields: [
        { key: 'name', label: 'Name', type: 'text', value: this.name || '' },
      ],
    };
  }

  applyEditValues(values, { createNodeName }) {
    this.name = String(values.name || '').trim() || createNodeName();
    return true;
  }
}

globalThis.StartGlyph = StartGlyph;
