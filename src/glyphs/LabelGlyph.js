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

  getEditSchema() {
    return {
      title: 'Edit Label',
      fields: [
        { key: 'name', label: 'Name', type: 'text', value: this.name || '' },
      ],
    };
  }

  applyEditValues(values, { createLabelName }) {
    this.name = String(values.name || '').trim() || createLabelName();
    return true;
  }

  execute({ currentValue }) {
    return currentValue;
  }
}

globalThis.LabelGlyph = LabelGlyph;
