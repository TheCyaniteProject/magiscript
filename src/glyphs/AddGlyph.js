class AddGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, operand }) {
    super({ guid, type: 'add', parentNodeGuid });
    this.operand = operand;
  }

  getTooltip() {
    return { title: 'Add', description: `Operand: ${this.operand}` };
  }

  execute({
    node,
    currentValue,
    directInput,
    paramInput,
    findIncomingOuterConnection,
    evaluateOuterGlyphValue,
    setRollingRuntimeValue,
    coerceNumber,
    runtimeContext,
  }) {
    const paramSource = findIncomingOuterConnection(node, this.guid);
    const operandValue = paramSource
      ? evaluateOuterGlyphValue(paramSource, directInput, paramInput, runtimeContext)
      : 1;
    const nextValue = coerceNumber(currentValue) + coerceNumber(operandValue);
    setRollingRuntimeValue(nextValue);
    return nextValue;
  }
}

globalThis.AddGlyph = AddGlyph;
