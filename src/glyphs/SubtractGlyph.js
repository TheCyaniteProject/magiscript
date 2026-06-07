class SubtractGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, operand }) {
    super({ guid, type: 'subtract', parentNodeGuid });
    this.operand = operand;
  }

  getTooltip() {
    return { title: 'Subtract', description: `Operand: ${this.operand}` };
  }

  getParamIOPorts() {
    return [{ defaultAngle: -Math.PI / 2 }];
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
    const nextValue = coerceNumber(currentValue) - coerceNumber(operandValue);
    setRollingRuntimeValue(nextValue);
    return nextValue;
  }
}

globalThis.SubtractGlyph = SubtractGlyph;
