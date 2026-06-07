class BooleanGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, operation = 'less', checked = false, ownerIfGlyphGuid = null }) {
    super({ guid, type: 'boolean', parentNodeGuid });
    this.operation = operation;
    this.checked = Boolean(checked);
    this.lastResult = this.checked ? 1 : 0;
    this.ownerIfGlyphGuid = ownerIfGlyphGuid;
  }

  static normalizeOperation(operation) {
    switch (operation) {
      case 'less':
      case 'greater':
      case 'equal':
      case 'not-equal':
        return operation;
      default:
        return 'equal';
    }
  }

  static getOperatorLabel(operation) {
    switch (operation) {
      case 'less':
        return 'LT';
      case 'greater':
        return 'GT';
      case 'equal':
        return 'EQ';
      case 'not-equal':
        return 'NE';
      default:
        return 'EQ';
    }
  }

  getDisplayLabel() {
    if (this.ring === 'outer') {
      return this.checked ? 'TR' : 'FA';
    }

    return BooleanGlyph.getOperatorLabel(this.operation);
  }

  getReferenceableLabel() {
    return `Boolean ${this.getDisplayLabel()}`;
  }

  getTooltip() {
    return this.ring === 'outer'
      ? { title: 'Boolean', description: `Literal: ${this.checked ? 'true' : 'false'}` }
      : { title: 'Boolean', description: `Operator: ${BooleanGlyph.getOperatorLabel(this.operation)}` };
  }

  isClickable() {
    return true;
  }

  execute({ node, currentValue, directInput, paramInput, evaluateOwnedBooleanGlyph }) {
    evaluateOwnedBooleanGlyph(node, this, currentValue, directInput, paramInput);
    return currentValue;
  }
}

globalThis.BooleanGlyph = BooleanGlyph;