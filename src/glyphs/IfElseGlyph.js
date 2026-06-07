class IfElseGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, mode = 'and', nextGlyphGuidFalse = null }) {
    super({ guid, type: 'ifelse', parentNodeGuid });
    this.mode = mode;
    this.nextGlyphGuidFalse = nextGlyphGuidFalse;
  }

  static getModeLabel(mode) {
    return mode === 'or' ? 'OR' : 'AND';
  }

  getParamIOPorts() {
    return [{ defaultAngle: -Math.PI / 2 }];
  }

  getOutputIOPorts() {
    return [
      { defaultAngle: Math.PI / 2 - 0.48 },
      { defaultAngle: Math.PI / 2 + 0.48 },
    ];
  }

  getOutputTarget(outputIndex = 0) {
    if (outputIndex === 1) {
      return this.nextGlyphGuidFalse ?? null;
    }

    if (outputIndex > 1) {
      return super.getOutputTarget(outputIndex);
    }

    return this.nextGlyphGuid ?? null;
  }

  getOutputTargetPort(outputIndex = 0) {
    return this.outputTargetPorts.get(outputIndex) || { kind: 'input', index: 0 };
  }

  setOutputTarget(targetGuid, outputIndex = 0, targetPort = null) {
    const normalizedTargetPort = targetPort && typeof targetPort === 'object'
      ? {
        kind: targetPort.kind === 'param' ? 'param' : 'input',
        index: Number.isFinite(targetPort.index) ? targetPort.index : 0,
      }
      : { kind: 'input', index: 0 };

    if (outputIndex === 1) {
      this.nextGlyphGuidFalse = targetGuid ?? null;
      if (!targetGuid) {
        this.outputTargetPorts.delete(outputIndex);
      } else {
        this.outputTargetPorts.set(outputIndex, normalizedTargetPort);
      }
      return;
    }

    if (outputIndex > 1) {
      super.setOutputTarget(targetGuid, outputIndex, targetPort);
      return;
    }

    this.nextGlyphGuid = targetGuid ?? null;
    if (!targetGuid) {
      this.outputTargetPorts.delete(outputIndex);
    } else {
      this.outputTargetPorts.set(outputIndex, normalizedTargetPort);
    }
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

  getEditSchema() {
    return {
      title: 'Edit If / Else',
      fields: [
        {
          key: 'mode',
          label: 'Boolean mode',
          type: 'select',
          value: this.mode === 'or' ? 'or' : 'and',
          options: [
            { value: 'and', label: 'AND' },
            { value: 'or', label: 'OR' },
          ],
        },
      ],
    };
  }

  applyEditValues(values) {
    this.mode = values.mode === 'or' ? 'or' : 'and';
    return true;
  }

  execute({ node, currentValue, directInput, paramInput, evaluateIfElseCondition }) {
    this.lastResult = evaluateIfElseCondition(node, this, currentValue, directInput, paramInput) ? 1 : 0;
    return currentValue;
  }
}

globalThis.IfElseGlyph = IfElseGlyph;