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

  isClickable() {
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
