class RuntimeMathService {
  static coerceNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  static evaluateBooleanOperation(operation, inputValue, paramValue, normalizeOperation) {
    const leftValue = RuntimeMathService.coerceNumber(inputValue);
    const rightValue = RuntimeMathService.coerceNumber(paramValue);
    const normalized = typeof normalizeOperation === 'function'
      ? normalizeOperation(operation)
      : operation;

    switch (normalized) {
      case 'less':
        return leftValue < rightValue;
      case 'greater':
        return leftValue > rightValue;
      case 'equal':
        return leftValue === rightValue;
      case 'not-equal':
        return leftValue !== rightValue;
      default:
        return leftValue === rightValue;
    }
  }
}

globalThis.RuntimeMathService = RuntimeMathService;
