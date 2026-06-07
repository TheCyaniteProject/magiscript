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

  canBeAddedToOuterRing() {
    return true;
  }

  isClickable() {
    return true;
  }

  getEditSchema({ findNodeByGuid, nodeHasParamInputConnection, ensureValueGlyphInputIsValid }) {
    const parentNode = this.parentNodeGuid ? findNodeByGuid(this.parentNodeGuid) : null;
    if (!parentNode) {
      return null;
    }

    ensureValueGlyphInputIsValid(this);
    const hasParam = nodeHasParamInputConnection(parentNode);
    const options = [{ value: '1', label: '1 - Direct' }];
    if (hasParam) {
      options.push({ value: '2', label: '2 - Param' });
    }

    return {
      title: 'Edit Value Input',
      fields: [
        {
          key: 'inputIndex',
          label: 'Input',
          type: 'select',
          value: String(this.inputIndex ?? 1),
          options,
        },
      ],
    };
  }

  applyEditValues(values) {
    this.inputIndex = Number(values.inputIndex) === 2 ? 2 : 1;
    return true;
  }

  execute({ currentValue }) {
    return currentValue;
  }
}

globalThis.ValueGlyph = ValueGlyph;
