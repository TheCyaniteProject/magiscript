class RuntimeContextService {
  static resetBooleanRuntimeState(referenceableGlyphs) {
    referenceableGlyphs.forEach((glyph) => {
      if (glyph.type === 'boolean') {
        glyph.lastResult = 0;
      }
    });
  }

  static createRuntimeContext(variableGlyphs) {
    const vars = new Map();
    variableGlyphs.forEach((glyph) => {
      vars.set(glyph.guid, glyph.value);
    });
    return { vars };
  }

  static getRuntimeVar(runtimeContext, glyph) {
    if (!runtimeContext?.vars) {
      return glyph.value;
    }

    return runtimeContext.vars.has(glyph.guid)
      ? runtimeContext.vars.get(glyph.guid)
      : glyph.value;
  }

  static setRuntimeVar(runtimeContext, glyph, nextValue, createRuntimeContext) {
    const nextContext = runtimeContext || createRuntimeContext();
    const normalized = nextValue === null || nextValue === undefined ? 'null' : String(nextValue);
    nextContext.vars.set(glyph.guid, normalized);
    return nextContext;
  }

  static getRollingValueGlyph(entryNode, findIncomingOuterConnection, getReferenceTarget) {
    if (!entryNode) {
      return null;
    }

    const startInputSource = findIncomingOuterConnection(entryNode, entryNode.startGlyph.guid);
    if (startInputSource?.type === 'variable') {
      return startInputSource;
    }

    if (startInputSource?.type === 'reference') {
      const target = getReferenceTarget(startInputSource);
      if (target?.type === 'variable') {
        return target;
      }
    }

    return entryNode.outerGlyphs.find((glyph) => glyph.type === 'variable' && String(glyph.name || '').toUpperCase() === 'IN') || null;
  }

  static getRollingRuntimeValue(runtimeContext, fallbackValue, getRollingValueGlyph, getRuntimeVar) {
    const rollingGlyph = getRollingValueGlyph();
    if (!rollingGlyph) {
      return fallbackValue;
    }

    return getRuntimeVar(runtimeContext, rollingGlyph);
  }

  static evaluateOuterGlyphValue(glyph, directInput, runtimeContext, deps) {
    if (!glyph) {
      return directInput;
    }

    if (glyph.type === 'value') {
      return deps.getRollingRuntimeValue(runtimeContext, directInput);
    }

    if (glyph.type === 'variable') {
      return runtimeContext?.vars?.has(glyph.guid) ? runtimeContext.vars.get(glyph.guid) : glyph.value;
    }

    if (glyph.type === 'reference') {
      const target = deps.getReferenceTarget(glyph);
      if (target?.type === 'boolean') {
        return target.ring === 'outer' ? (target.checked ? 1 : 0) : (target.lastResult ?? 0);
      }

      if (!target) {
        return directInput;
      }

      return target.type === 'variable'
        ? (runtimeContext?.vars?.has(target.guid) ? runtimeContext.vars.get(target.guid) : target.value)
        : directInput;
    }

    if (glyph.type === 'boolean') {
      return glyph.checked ? 1 : 0;
    }

    return directInput;
  }

  static resolveParamInputForChild(parentNode, childNodeGuid, directInput, runtimeContext, deps) {
    const paramSource = deps.findIncomingOuterConnection(parentNode, childNodeGuid);
    if (!paramSource) {
      return null;
    }

    return deps.evaluateOuterGlyphValue(paramSource, directInput, null, runtimeContext);
  }
}

globalThis.RuntimeContextService = RuntimeContextService;
