class IfElseGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, mode = 'and', nextGlyphGuidFalse = null }) {
    super({ guid, type: 'ifelse', parentNodeGuid });
    this.mode = mode;
    this.nextGlyphGuidFalse = nextGlyphGuidFalse;
  }

  static getModeLabel(mode) {
    return mode === 'or' ? 'OR' : 'AND';
  }

  getOutputTarget(outputIndex = 0) {
    if (outputIndex === 1) {
      return this.nextGlyphGuidFalse ?? null;
    }

    return this.nextGlyphGuid ?? null;
  }

  setOutputTarget(targetGuid, outputIndex = 0) {
    if (outputIndex === 1) {
      this.nextGlyphGuidFalse = targetGuid ?? null;
      return;
    }

    this.nextGlyphGuid = targetGuid ?? null;
    this.nextGlyphGuidIsAuto = false;
  }

  disconnectOutput(outputIndex = 0) {
    this.setOutputTarget(null, outputIndex);
  }

  getTooltip() {
    return {
      title: 'If / Else',
      description: `Mode: ${IfElseGlyph.getModeLabel(this.mode)}. First output is pass, second output is fail.`,
    };
  }

  isClickable() {
    return true;
  }

  execute({ node, currentValue, directInput, paramInput, evaluateIfElseCondition }) {
    this.lastResult = evaluateIfElseCondition(node, this, currentValue, directInput, paramInput) ? 1 : 0;
    return currentValue;
  }
}

globalThis.IfElseGlyph = IfElseGlyph;