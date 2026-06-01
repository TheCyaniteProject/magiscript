class IOConnector {
  constructor({ x, y, kind, ownerGuid }) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.ownerGuid = ownerGuid;
  }
}

globalThis.IOConnector = IOConnector;
