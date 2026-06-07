class SetValueGlyph extends Glyph {
  constructor({ guid, parentNodeGuid }) {
    super({ guid, type: 'setvalue', parentNodeGuid });
  }

  getTooltip() {
    return { title: 'Set Value', description: 'Sets previous variable/reference to Param input.' };
  }

  execute({
    node,
    currentValue,
    directInput,
    paramInput,
    findIncomingOuterConnection,
    evaluateOuterGlyphValue,
    setRollingRuntimeValue,
    runtimeContext,
  }) {
    const paramSource = findIncomingOuterConnection(node, this.guid);
    const nextValue = paramSource
      ? evaluateOuterGlyphValue(paramSource, directInput, paramInput, runtimeContext)
      : currentValue;
    setRollingRuntimeValue(nextValue);
    return nextValue;
  }
}

globalThis.SetValueGlyph = SetValueGlyph;
