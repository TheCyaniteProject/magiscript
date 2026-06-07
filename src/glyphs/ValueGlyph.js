class ValueGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name, inputIndex }) {
    super({ guid, type: 'value', parentNodeGuid });
    this.name = name;
    this.inputIndex = inputIndex;
  }

  getTooltip() {
    return {
      title: `${this.name} (Deprecated)`,
      description: 'Kept for compatibility. Runtime already carries the rolling value without this glyph.',
    };
  }

  execute({ currentValue }) {
    return currentValue;
  }
}

globalThis.ValueGlyph = ValueGlyph;
