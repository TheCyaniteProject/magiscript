class OutputGlyph extends Glyph {
  constructor({ guid, parentNodeGuid }) {
    super({ guid, type: 'output', parentNodeGuid });
  }

  getTooltip() {
    return { title: 'Output', description: 'Logs the current value to the console.' };
  }

  execute({ currentValue, logOutput }) {
    logOutput(currentValue);
    return currentValue;
  }
}

globalThis.OutputGlyph = OutputGlyph;
