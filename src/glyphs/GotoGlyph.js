class GotoGlyph extends Glyph {
  constructor({ guid, parentNodeGuid, targetLabelGuid }) {
    super({ guid, type: 'goto', parentNodeGuid });
    this.targetLabelGuid = targetLabelGuid;
  }

  getTooltip({ resolveGotoTarget, getJumpTargetLabel }) {
    const target = resolveGotoTarget(this);
    return {
      title: 'Goto',
      description: target ? `Target: ${getJumpTargetLabel(target)}` : 'Target: none',
    };
  }

  isClickable() {
    return true;
  }

  execute({ currentValue, resolveGotoTarget }) {
    const target = resolveGotoTarget(this);
    return target
      ? { kind: 'goto', targetLabelGuid: target.guid, value: currentValue }
      : currentValue;
  }
}

globalThis.GotoGlyph = GotoGlyph;
