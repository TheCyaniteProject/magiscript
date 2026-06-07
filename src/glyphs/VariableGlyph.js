class VariableGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, name, value }) {
    super({ guid, type: 'variable', parentNodeGuid });
    this.name = name;
    this.value = value;
  }

  getTooltip() {
    return { title: this.name, description: `Value: ${this.value}` };
  }

  getReferenceableLabel() {
    return this.name;
  }

  canBeAddedToOuterRing() {
    return true;
  }

  isClickable() {
    return true;
  }

  getEditSchema() {
    return {
      title: 'Edit Variable',
      fields: [
        { key: 'name', label: 'Name', type: 'text', value: this.name || '' },
        { key: 'value', label: 'Value', type: 'text', value: this.value === 'null' ? '' : (this.value || '') },
      ],
    };
  }

  applyEditValues(values, { createVariableName }) {
    this.name = String(values.name || '').trim() || createVariableName();
    this.value = String(values.value || '').trim() === '' ? 'null' : String(values.value);
    return true;
  }

  execute({ currentValue, getRuntimeVar, setRuntimeVar }) {
    if (this.ring === 'outer') {
      return getRuntimeVar(this);
    }

    setRuntimeVar(this, currentValue);
    return currentValue;
  }
}

globalThis.VariableGlyph = VariableGlyph;
