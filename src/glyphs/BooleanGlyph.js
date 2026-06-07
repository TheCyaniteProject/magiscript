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

  canBeAddedToOuterRing() {
    return true;
  }

  getParamIOPorts() {
    if (this.ring === 'outer' || this.ownerIfGlyphGuid) {
      return [];
    }

    return [{ defaultAngle: -Math.PI / 2 }];
  }

  isClickable() {
    return true;
  }

  getEditSchema({ normalizeBooleanOperation }) {
    this.operation = normalizeBooleanOperation(this.operation);
    const isOuterGlyph = this.ring === 'outer';

    return {
      title: 'Edit Boolean',
      fields: isOuterGlyph
        ? [
          {
            key: 'checked',
            label: 'Value',
            type: 'select',
            value: this.checked ? 'true' : 'false',
            options: [
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' },
            ],
          },
        ]
        : [
          {
            key: 'operation',
            label: 'Operator',
            type: 'select',
            value: this.operation,
            options: [
              { value: 'less', label: 'LT - Less' },
              { value: 'greater', label: 'GT - Greater' },
              { value: 'equal', label: 'EQ - Equal' },
              { value: 'not-equal', label: 'NE - Not Equal' },
            ],
          },
        ],
    };
  }

  applyEditValues(values, { normalizeBooleanOperation }) {
    if (this.ring === 'outer') {
      this.checked = values.checked === 'true';
    } else {
      this.operation = normalizeBooleanOperation(values.operation);
    }

    return true;
  }

  execute({ node, currentValue, directInput, paramInput, evaluateOwnedBooleanGlyph }) {
    evaluateOwnedBooleanGlyph(node, this, currentValue, directInput, paramInput);
    return currentValue;
  }
}

globalThis.BooleanGlyph = BooleanGlyph;