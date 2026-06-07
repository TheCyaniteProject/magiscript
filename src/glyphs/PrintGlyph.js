class PrintGlyph extends Glyph {
  constructor({ guid, parentNodeGuid }) {
    super({ guid, type: 'print', parentNodeGuid });
  }

  getTooltip() {
    return { title: 'Print', description: 'Logs the current value to the console.' };
  }

  execute({ currentValue, logOutput }) {
    logOutput(currentValue);
    return currentValue;
  }
}

globalThis.PrintGlyph = PrintGlyph;
