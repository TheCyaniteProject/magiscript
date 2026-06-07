class Glyph {
  constructor({ guid, type, parentNodeGuid }) {
    this.guid = guid;
    this.type = type;
    this.parentNodeGuid = parentNodeGuid;
    this.nextGlyphGuid = null;
    this.nextGlyphGuidIsAuto = true;
    this.additionalOutputTargets = new Map();
    this.outputTargetPorts = new Map();
    this.x = 0;
    this.y = 0;
    this.radius = 0;
    this.lineWidth = 0;
    this.ring = 'inner';
    this.io = {
      input: null,
      output: null,
      outputs: [],
      param: null,
      params: [],
    };
  }

  getInputIOPort() {
    return { defaultAngle: -Math.PI / 2 };
  }

  getParamIOPorts() {
    return [];
  }

  getOutputIOPorts() {
    return [{ defaultAngle: Math.PI / 2 }];
  }

  getBoundaryDistance(unitX, unitY) {
    return this.radius;
  }

  getOuterRadius(unitX, unitY) {
    return this.getBoundaryDistance(unitX, unitY) + this.lineWidth / 2;
  }

  getPointAtAngle(angle, circleOffset) {
    const unitX = Math.cos(angle);
    const unitY = Math.sin(angle);
    const edge = this.getOuterRadius(unitX, unitY);
    return {
      x: this.x + unitX * (edge + circleOffset),
      y: this.y + unitY * (edge + circleOffset),
    };
  }

  getAngleTo(target) {
    if (!target) {
      return null;
    }

    return Math.atan2(target.y - this.y, target.x - this.x);
  }

  updateIOLayout({
    inputSource,
    outputTargets = [],
    paramSources = [],
    circleOffset,
    circleRadius,
    inputPort = this.getInputIOPort(),
    paramPorts = this.getParamIOPorts(),
    outputPorts = this.getOutputIOPorts(),
    allowInput = true,
    allowOutput = true,
    allowParam = false,
    allowOutputIndexes = null,
    allowParamIndexes = null,
  }) {
    if (!globalThis.IOPlacementService) {
      return;
    }

    this.io = IOPlacementService.placeConnectors({
      glyph: this,
      inputSource,
      outputTargets,
      paramSources,
      circleOffset,
      circleRadius,
      inputPort,
      paramPorts,
      outputPorts,
      allowInput,
      allowOutput,
      allowParam,
      allowOutputIndexes,
      allowParamIndexes,
    });
  }

  getOutputTarget(outputIndex = 0) {
    if (outputIndex === 0) {
      return this.nextGlyphGuid ?? null;
    }

    return this.additionalOutputTargets.get(outputIndex) ?? null;
  }

  getOutputTargetPort(outputIndex = 0) {
    return this.outputTargetPorts.get(outputIndex) || { kind: 'input', index: 0 };
  }

  getSerializedOutputTargetPorts() {
    const entries = [];
    for (const [outputIndex, port] of this.outputTargetPorts.entries()) {
      if (!port) {
        continue;
      }

      entries.push({
        outputIndex,
        kind: port.kind === 'param' ? 'param' : 'input',
        index: Number.isFinite(port.index) ? port.index : 0,
      });
    }

    return entries;
  }

  getSerializedOutputTargets() {
    const entries = [];
    for (const [outputIndex, targetGuid] of this.additionalOutputTargets.entries()) {
      if (!targetGuid) {
        continue;
      }

      entries.push({ outputIndex, targetGuid });
    }

    return entries;
  }

  setOutputTarget(targetGuid, outputIndex = 0, targetPort = null) {
    if (outputIndex === 0) {
      this.nextGlyphGuid = targetGuid ?? null;
    } else if (!targetGuid) {
      this.additionalOutputTargets.delete(outputIndex);
    } else {
      this.additionalOutputTargets.set(outputIndex, targetGuid);
    }

    if (!targetGuid) {
      this.outputTargetPorts.delete(outputIndex);
    } else {
      const normalizedTargetPort = targetPort && typeof targetPort === 'object'
        ? {
          kind: targetPort.kind === 'param' ? 'param' : 'input',
          index: Number.isFinite(targetPort.index) ? targetPort.index : 0,
        }
        : { kind: 'input', index: 0 };
      this.outputTargetPorts.set(outputIndex, normalizedTargetPort);
    }

    this.nextGlyphGuidIsAuto = false;
  }

  disconnectOutput(outputIndex = 0) {
    this.setOutputTarget(null, outputIndex);
  }

  getTooltip() {
    return null;
  }

  canBeAddedToOuterRing() {
    return false;
  }

  isClickable() {
    return false;
  }

  getEditSchema() {
    return null;
  }

  applyEditValues() {
    return false;
  }

  onClick({ openGlyphEditor, clientX, clientY }) {
    if (!openGlyphEditor) {
      return false;
    }

    return openGlyphEditor(this, clientX, clientY);
  }

  execute({ currentValue }) {
    return currentValue;
  }
}

globalThis.Glyph = Glyph;
