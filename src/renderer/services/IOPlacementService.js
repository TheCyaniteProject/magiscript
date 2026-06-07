class IOPlacementService {
  static normalizeAllowByIndex(ports, allow, allowIndexes) {
    if (!allow || !Array.isArray(ports) || ports.length === 0) {
      return [];
    }

    if (Array.isArray(allowIndexes)) {
      return ports.map((_, index) => Boolean(allowIndexes[index]));
    }

    return ports.map(() => true);
  }

  static normalizeAngle(angle) {
    const turn = Math.PI * 2;
    let normalized = angle % turn;
    if (normalized <= -Math.PI) {
      normalized += turn;
    }
    if (normalized > Math.PI) {
      normalized -= turn;
    }
    return normalized;
  }

  static shortestDelta(fromAngle, toAngle) {
    return IOPlacementService.normalizeAngle(toAngle - fromAngle);
  }

  static solvePackedAngles(items, minSeparation) {
    if (!Array.isArray(items) || items.length <= 1) {
      return;
    }

    const turn = Math.PI * 2;
    const sorted = [...items].sort((left, right) => left.angle - right.angle);

    for (let i = 1; i < sorted.length; i += 1) {
      const minAngle = sorted[i - 1].angle + minSeparation;
      if (sorted[i].angle < minAngle) {
        sorted[i].angle = minAngle;
      }
    }

    const wrappedOverflow = sorted[sorted.length - 1].angle - sorted[0].angle - (turn - minSeparation);
    if (wrappedOverflow > 0) {
      for (let i = 0; i < sorted.length; i += 1) {
        sorted[i].angle -= wrappedOverflow * ((i + 1) / sorted.length);
      }

      for (let i = sorted.length - 2; i >= 0; i -= 1) {
        const maxAngle = sorted[i + 1].angle - minSeparation;
        if (sorted[i].angle > maxAngle) {
          sorted[i].angle = maxAngle;
        }
      }
    }

    sorted.forEach((item) => {
      item.angle = IOPlacementService.normalizeAngle(item.angle);
    });
  }

  static buildGroupDefaults(entries, baseAngle, minSeparation) {
    const disconnected = entries.filter((entry) => !entry.connected);
    if (disconnected.length === 0) {
      return;
    }

    const step = minSeparation * 1.1;
    disconnected.forEach((entry, index) => {
      const centerOffset = index - ((disconnected.length - 1) / 2);
      entry.angle = baseAngle + centerOffset * step;
      entry.desiredAngle = entry.angle;
    });
  }

  static placeConnectors({
    glyph,
    circleOffset,
    circleRadius,
    inputPort,
    paramPorts,
    outputPorts,
    inputSource,
    paramSources,
    outputTargets,
    allowInput,
    allowOutput,
    allowParam,
    allowOutputIndexes,
    allowParamIndexes,
  }) {
    const allowParamByIndex = IOPlacementService.normalizeAllowByIndex(paramPorts, allowParam, allowParamIndexes);
    const allowOutputByIndex = IOPlacementService.normalizeAllowByIndex(outputPorts, allowOutput, allowOutputIndexes);

    const placementRadius = Math.max(
      1,
      glyph.getOuterRadius(1, 0) + circleOffset,
    );
    const minChord = Math.max(1, (circleRadius * 2) + 2);
    const minSeparation = Math.min(Math.PI * 0.95, (2 * Math.asin(Math.min(1, minChord / (2 * placementRadius)))) || 0.24);

    const topEntries = [];
    const bottomEntries = [];

    if (allowInput && inputPort) {
      const connectedTarget = inputSource || null;
      topEntries.push({
        kind: 'input',
        ownerGuid: glyph.guid,
        inputPort,
        connected: Boolean(connectedTarget),
        desiredAngle: connectedTarget ? glyph.getAngleTo(connectedTarget) : null,
        angle: connectedTarget ? glyph.getAngleTo(connectedTarget) : null,
      });
    }

    (paramPorts || []).forEach((port, paramIndex) => {
      if (!allowParamByIndex[paramIndex]) {
        return;
      }

      const connectedTarget = paramSources[paramIndex] || null;
      topEntries.push({
        kind: 'param-input',
        ownerGuid: glyph.guid,
        paramIndex,
        connected: Boolean(connectedTarget),
        desiredAngle: connectedTarget ? glyph.getAngleTo(connectedTarget) : null,
        angle: connectedTarget ? glyph.getAngleTo(connectedTarget) : null,
      });
    });

    (outputPorts || []).forEach((port, outputIndex) => {
      if (!allowOutputByIndex[outputIndex]) {
        return;
      }

      const connectedTarget = outputTargets[outputIndex] || null;
      bottomEntries.push({
        kind: 'output',
        ownerGuid: glyph.guid,
        outputIndex,
        connected: Boolean(connectedTarget),
        desiredAngle: connectedTarget ? glyph.getAngleTo(connectedTarget) : null,
        angle: connectedTarget ? glyph.getAngleTo(connectedTarget) : null,
      });
    });

    IOPlacementService.buildGroupDefaults(topEntries, -Math.PI / 2, minSeparation);
    IOPlacementService.buildGroupDefaults(bottomEntries, Math.PI / 2, minSeparation);

    const allEntries = [...topEntries, ...bottomEntries]
      .filter((entry) => Number.isFinite(entry.angle))
      .map((entry) => ({
        ...entry,
        desiredAngle: Number.isFinite(entry.desiredAngle) ? entry.desiredAngle : entry.angle,
        angle: IOPlacementService.normalizeAngle(entry.angle),
      }));

    // Iteratively preserve desired direction while enforcing non-overlap.
    for (let i = 0; i < 4; i += 1) {
      allEntries.forEach((entry) => {
        const pull = entry.connected ? 0.45 : 0.25;
        const delta = IOPlacementService.shortestDelta(entry.angle, entry.desiredAngle);
        entry.angle = IOPlacementService.normalizeAngle(entry.angle + (delta * pull));
      });

      IOPlacementService.solvePackedAngles(allEntries, minSeparation);
    }

    const connectors = allEntries.map((entry) => {
      const point = glyph.getPointAtAngle(entry.angle, circleOffset);
      return new IOConnector({
        x: point.x,
        y: point.y,
        kind: entry.kind,
        ownerGuid: entry.ownerGuid,
        outputIndex: entry.outputIndex ?? 0,
        paramIndex: entry.paramIndex ?? 0,
      });
    });

    const layout = {
      input: connectors.find((connector) => connector.kind === 'input') || null,
      output: null,
      outputs: connectors.filter((connector) => connector.kind === 'output'),
      param: null,
      params: connectors.filter((connector) => connector.kind === 'param-input'),
    };

    layout.output = layout.outputs[0] || null;
    layout.param = layout.params[0] || null;

    return layout;
  }
}

globalThis.IOPlacementService = IOPlacementService;
