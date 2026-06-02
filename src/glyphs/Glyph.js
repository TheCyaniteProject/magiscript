class Glyph {
  constructor({ guid, type, parentNodeGuid }) {
    this.guid = guid;
    this.type = type;
    this.parentNodeGuid = parentNodeGuid;
    this.nextGlyphGuid = null;
    this.nextGlyphGuidIsAuto = true;
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
    };
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
    outputTarget,
    paramSource,
    circleOffset,
    circleRadius,
    allowInput = true,
    allowOutput = true,
    allowParam = false,
    outputAngles = null,
  }) {
    const defaultInputAngle = -Math.PI / 2;
    const defaultOutputAngle = Math.PI / 2;

    let inputAngle = allowInput ? (this.getAngleTo(inputSource) ?? defaultInputAngle) : null;
    let paramAngle = allowParam ? (this.getAngleTo(paramSource) ?? defaultInputAngle) : null;
    const outputAngle = allowOutput ? (this.getAngleTo(outputTarget) ?? defaultOutputAngle) : null;

    if (allowInput && allowParam && inputAngle !== null && paramAngle !== null) {
      const separation = Math.max(0.32, Math.min(0.6, circleRadius / Math.max(1, this.radius)));
      const diff = Math.abs(((inputAngle - paramAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (diff < separation) {
        const mid = (inputAngle + paramAngle) / 2;
        inputAngle = mid - separation / 2;
        paramAngle = mid + separation / 2;
      }
    }

    this.io.input = allowInput && inputAngle !== null
      ? new IOConnector({
        x: this.getPointAtAngle(inputAngle, circleOffset).x,
        y: this.getPointAtAngle(inputAngle, circleOffset).y,
        kind: 'input',
        ownerGuid: this.guid,
      })
      : null;

    const resolvedOutputAngles = allowOutput
      ? (Array.isArray(outputAngles) && outputAngles.length > 0 ? outputAngles : [outputAngle])
      : [];

    this.io.outputs = resolvedOutputAngles
      .filter((angle) => angle !== null)
      .map((angle, outputIndex) => {
        const point = this.getPointAtAngle(angle, circleOffset);
        return new IOConnector({
          x: point.x,
          y: point.y,
          kind: 'output',
          ownerGuid: this.guid,
          outputIndex,
        });
      });

    this.io.output = this.io.outputs[0] ?? null;

    this.io.param = allowParam && paramAngle !== null
      ? new IOConnector({
        x: this.getPointAtAngle(paramAngle, circleOffset).x,
        y: this.getPointAtAngle(paramAngle, circleOffset).y,
        kind: 'param-input',
        ownerGuid: this.guid,
      })
      : null;
  }
}

globalThis.Glyph = Glyph;
