class LabelGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name }) {
    super({ guid, type: 'label', parentNodeGuid });
    this.name = name;
  }

  getDisplayName() {
    return this.name?.trim() || 'label';
  }

  getJumpTargetLabel() {
    return this.getDisplayName();
  }

  getTooltip() {
    return { title: 'Label', description: `Name: ${this.getDisplayName()}` };
  }

  isClickable() {
    return true;
  }

  execute({ currentValue }) {
    return currentValue;
  }
}

globalThis.LabelGlyph = LabelGlyph;
