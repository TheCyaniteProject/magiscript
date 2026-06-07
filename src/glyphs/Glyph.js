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
    const normalizeAllowByIndex = (ports, allow, allowIndexes) => {
      if (!allow || !Array.isArray(ports) || ports.length === 0) {
        return [];
      }

      if (Array.isArray(allowIndexes)) {
        return ports.map((_, index) => Boolean(allowIndexes[index]));
      }

      return ports.map(() => true);
    };

    const getResolvedAngle = (port, target, fallback = -Math.PI / 2) => {
      if (target) {
        return this.getAngleTo(target) ?? (port?.defaultAngle ?? fallback);
      }

      return port?.defaultAngle ?? fallback;
    };

    let inputAngle = allowInput && inputPort
      ? getResolvedAngle(inputPort, inputSource, -Math.PI / 2)
      : null;

    const allowParamByIndex = normalizeAllowByIndex(paramPorts, allowParam, allowParamIndexes);
    const paramAngles = paramPorts.map((port, index) => {
      if (!allowParamByIndex[index]) {
        return null;
      }

      return getResolvedAngle(port, paramSources[index], -Math.PI / 2);
    });

    const activeParamAngles = paramAngles
      .map((angle, index) => ({ angle, index }))
      .filter((entry) => entry.angle !== null);

    if (allowInput && inputAngle !== null && activeParamAngles.length > 0) {
      const separation = Math.max(0.32, Math.min(0.6, circleRadius / Math.max(1, this.radius)));
      const sortedAngles = [...activeParamAngles].sort((left, right) => left.angle - right.angle);

      sortedAngles.forEach((entry, sortedIndex) => {
        const offset = (sortedIndex - ((sortedAngles.length - 1) / 2)) * separation;
        paramAngles[entry.index] = inputAngle + offset;
      });

      inputAngle -= (sortedAngles.length * separation) / 2;
    }

    this.io.input = allowInput && inputAngle !== null
      ? new IOConnector({
        x: this.getPointAtAngle(inputAngle, circleOffset).x,
        y: this.getPointAtAngle(inputAngle, circleOffset).y,
        kind: 'input',
        ownerGuid: this.guid,
      })
      : null;

    const allowOutputByIndex = normalizeAllowByIndex(outputPorts, allowOutput, allowOutputIndexes);
    this.io.outputs = outputPorts
      .map((port, outputIndex) => {
        if (!allowOutputByIndex[outputIndex]) {
          return null;
        }

        const angle = getResolvedAngle(port, outputTargets[outputIndex], Math.PI / 2);
        const point = this.getPointAtAngle(angle, circleOffset);
        return new IOConnector({
          x: point.x,
          y: point.y,
          kind: 'output',
          ownerGuid: this.guid,
          outputIndex,
        });
      })
      .filter(Boolean);

    this.io.output = this.io.outputs[0] ?? null;

    this.io.params = paramPorts
      .map((_, paramIndex) => {
        const angle = paramAngles[paramIndex];
        if (angle === null) {
          return null;
        }

        const point = this.getPointAtAngle(angle, circleOffset);
        return new IOConnector({
          x: point.x,
          y: point.y,
          kind: 'param-input',
          ownerGuid: this.guid,
          paramIndex,
        });
      })
      .filter(Boolean);

    this.io.param = this.io.params[0] ?? null;
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
