class IOConnector {
  constructor({ x, y, kind, ownerGuid, outputIndex = 0, paramIndex = 0 }) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.ownerGuid = ownerGuid;
    this.outputIndex = outputIndex;
    this.paramIndex = paramIndex;
  }
}

globalThis.IOConnector = IOConnector;
