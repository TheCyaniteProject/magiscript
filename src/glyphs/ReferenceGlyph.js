class ReferenceGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, referenceGlyphGuid = null }) {
    super({ guid, type: 'reference', parentNodeGuid });
    this.referenceGlyphGuid = referenceGlyphGuid;
  }

  getTooltip({ resolveReferenceTarget, getReferenceableLabel }) {
    const target = resolveReferenceTarget(this);
    return {
      title: 'Reference',
      description: target ? `Target: ${getReferenceableLabel(target)}` : 'Target: none',
    };
  }

  isClickable() {
    return true;
  }

  execute({ currentValue, resolveReferenceTarget, getRuntimeVar, setRuntimeVar }) {
    const target = resolveReferenceTarget(this);

    if (this.ring === 'outer') {
      if (target?.type === 'boolean') {
        return target.ring === 'outer'
          ? (target.checked ? 1 : target.lastResult ?? 0)
          : (target.lastResult ?? 0);
      }

      if (!target) {
        return currentValue;
      }

      return target.type === 'variable' ? getRuntimeVar(target) : currentValue;
    }

    if (target?.type === 'boolean') {
      return currentValue;
    }

    if (target && target.type === 'variable') {
      setRuntimeVar(target, currentValue);
    }

    return currentValue;
  }
}

globalThis.ReferenceGlyph = ReferenceGlyph;
