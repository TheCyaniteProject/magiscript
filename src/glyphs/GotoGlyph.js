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

  getOutputIOPorts() {
    return [];
  }

  isClickable() {
    return true;
  }

  getEditSchema({ getAllLabelGlyphs, getJumpTargetLabel }) {
    const labels = getAllLabelGlyphs();
    return {
      title: 'Edit Goto',
      fields: [
        {
          key: 'targetLabelGuid',
          label: 'Target',
          type: 'select',
          value: this.targetLabelGuid || '',
          options: [
            { value: '', label: labels.length > 0 ? 'None' : 'No labels available' },
            ...labels.map((labelGlyph) => ({
              value: labelGlyph.guid,
              label: getJumpTargetLabel(labelGlyph),
            })),
          ],
        },
      ],
    };
  }

  applyEditValues(values) {
    this.targetLabelGuid = values.targetLabelGuid || null;
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
