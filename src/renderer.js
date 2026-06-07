const appShell = document.querySelector('.app-shell');
const trayToggle = document.getElementById('trayToggle');
const recenterCanvasButton = document.getElementById('recenterCanvas');
const focusParentNodeButton = document.getElementById('focusParentNode');
const playProgramButton = document.getElementById('playProgram');
const stepProgramButton = document.getElementById('stepProgram');
const saveProgramButton = document.getElementById('saveProgram');
const loadProgramButton = document.getElementById('loadProgram');
const lineToolToggle = document.getElementById('lineToolToggle');
const glyphCards = document.querySelectorAll('.object-card');
const hoverTooltip = document.getElementById('hoverTooltip');
const messageLog = document.getElementById('messageLog');
const messageLogBody = document.getElementById('messageLogBody');
const messageLogToggle = document.getElementById('messageLogToggle');
const variableModalBackdrop = document.getElementById('variableModalBackdrop');
const variableModalNameInput = document.getElementById('variableModalNameInput');
const variableModalInput = document.getElementById('variableModalInput');
const variableModalAccept = document.getElementById('variableModalAccept');
const variableModalCancel = document.getElementById('variableModalCancel');
const labelModalBackdrop = document.getElementById('labelModalBackdrop');
const labelModalNameInput = document.getElementById('labelModalNameInput');
const labelModalAccept = document.getElementById('labelModalAccept');
const labelModalCancel = document.getElementById('labelModalCancel');
const referenceModalBackdrop = document.getElementById('referenceModalBackdrop');
const referenceModalSelect = document.getElementById('referenceModalSelect');
const referenceModalAccept = document.getElementById('referenceModalAccept');
const referenceModalCancel = document.getElementById('referenceModalCancel');
const booleanModalBackdrop = document.getElementById('booleanModalBackdrop');
const booleanModalOperatorField = document.getElementById('booleanModalOperatorField');
const booleanModalOperatorSelect = document.getElementById('booleanModalOperatorSelect');
const booleanModalCheckboxField = document.getElementById('booleanModalCheckboxField');
const booleanModalCheckbox = document.getElementById('booleanModalCheckbox');
const booleanModalAccept = document.getElementById('booleanModalAccept');
const booleanModalCancel = document.getElementById('booleanModalCancel');
const ifElseModalBackdrop = document.getElementById('ifElseModalBackdrop');
const ifElseModalModeSelect = document.getElementById('ifElseModalModeSelect');
const ifElseModalAccept = document.getElementById('ifElseModalAccept');
const ifElseModalCancel = document.getElementById('ifElseModalCancel');
const deleteModalBackdrop = document.getElementById('deleteModalBackdrop');
const deleteModalConfirm = document.getElementById('deleteModalConfirm');
const deleteModalCancel = document.getElementById('deleteModalCancel');
const dropZone = document.getElementById('dropZone');
const canvas = document.getElementById('sceneCanvas');
const context = canvas.getContext('2d');
const spellcircleDebugEnabled = Boolean(window.SpellcircleFile?.isDebugEnabled?.());

const topLevelNodes = [];
let focusedNode = null;
let activeVariableGlyph = null;
let activeLabelGlyph = null;
let activeReferenceGlyph = null;
let activeValueGlyph = null;
let activeBooleanGlyph = null;
let activeIfElseGlyph = null;
let activeValueDropdown = null;
let activeGotoGlyph = null;
let activeGotoDropdown = null;
let hoverCanvasGlyphGuid = null;
let hoverIfElseGlyphGuid = null;
let pendingDelete = null;
let variableCount = 0;
let labelCount = 0;
let nodeCount = 0;
let lineToolEnabled = false;
const NODE_LINE_TOOL_MIN_SCREEN_FRACTION = 0.05;

const wireDragState = {
  active: false,
  pointerId: null,
  node: null,
  fromGuid: null,
  fromOutputIndex: 0,
  fromPoint: null,
  toWorld: null,
};

const panState = {
  active: false,
  moved: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
};

const dragState = {
  active: false,
  moved: false,
  pointerId: null,
  glyph: null,
  sourceNode: null,
  worldX: 0,
  worldY: 0,
};

const GRID_MINOR_STEP = 24;
const GRID_MAJOR_STEP = 96;

// Glyph font configuration — adjust these to change glyph text appearance.
// Matches: font-family: "Mr De Haviland", cursive;
const GLYPH_FONT_FAMILY = '"Mr De Haviland", cursive';
const GLYPH_FONT_WEIGHT = '400';

const ROOT_NODE_RADIUS = 192;
const CHILD_BASE_RADIUS = 33.6;
const MIN_CHILD_RADIUS = 12;
const BASE_NODE_LINE_WIDTH = 3;
const GROUP_CHILD_BORDER_GAP = 18;
const GROUP_CHILD_GAP = 8;
const GROUP_LINE_GAP = 10;
const GROUP_MIN_LINE_LENGTH = 16;
const GROUP_ARROW_GAP = 12;
const CONNECTOR_BASE_RADIUS = CHILD_BASE_RADIUS * 2;
const START_ANGLE = -Math.PI / 2;
const CHILD_RADIUS_RATIO = CHILD_BASE_RADIUS / ROOT_NODE_RADIUS;
const MIN_CHILD_RADIUS_RATIO = MIN_CHILD_RADIUS / ROOT_NODE_RADIUS;
const NODE_LINE_WIDTH_RATIO = BASE_NODE_LINE_WIDTH / ROOT_NODE_RADIUS;
const GROUP_CHILD_BORDER_GAP_RATIO = GROUP_CHILD_BORDER_GAP / ROOT_NODE_RADIUS;
const GROUP_CHILD_GAP_RATIO = GROUP_CHILD_GAP / ROOT_NODE_RADIUS;
const GROUP_LINE_GAP_RATIO = GROUP_LINE_GAP / ROOT_NODE_RADIUS;
const GROUP_MIN_LINE_LENGTH_RATIO = GROUP_MIN_LINE_LENGTH / ROOT_NODE_RADIUS;
const GROUP_ARROW_GAP_RATIO = GROUP_ARROW_GAP / ROOT_NODE_RADIUS;
const CONNECTOR_RADIUS_RATIO = CONNECTOR_BASE_RADIUS / ROOT_NODE_RADIUS;
const SYSTEM_VALUE_DEFAULT = 'null';
const RENDER_MODE_FULL = 'full';
const RENDER_MODE_FOCUS = 'focus';
const RENDER_MODE_CONTEXT = 'context';
const RENDER_MODE_CONTEXT_NODE_ONLY = 'context-node-only';
const RENDER_MODE_CHILD_CONTEXT = 'child-context';
const RENDER_MODE_CHILD_CONTEXT_NODE_ONLY = 'child-context-node-only';

let hiddenContextNodeGuid = null;
const PARENT_CONTEXT_LINE_WIDTH_MULTIPLIER = 1.5;
let isProgramRunning = false;
let stepExecutionState = null;

function createGuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `guid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createVariableName() {
  variableCount += 1;
  return `variable_${variableCount}`;
}

function createLabelName() {
  labelCount += 1;
  return `label_${labelCount}`;
}

function createNodeName() {
  nodeCount += 1;
  return `node_${nodeCount}`;
}

function getGlyphShortLabel(value, fallback) {
  const normalized = String(value || '').trim();
  if (normalized === '') {
    return fallback;
  }

  return normalized.slice(0, 4).toUpperCase();
}

function isOuterParamGlyphType(type) {
  return type === 'variable' || type === 'reference' || type === 'value' || type === 'boolean';
}

function isOwnedBooleanGlyph(glyph) {
  return glyph?.type === 'boolean' && Boolean(glyph.ownerIfGlyphGuid);
}

function isOwnedBooleanVisible(glyph) {
  return isOwnedBooleanGlyph(glyph) && hoverIfElseGlyphGuid === glyph.ownerIfGlyphGuid;
}

function getOwnedBooleans(ifGlyph, node = null) {
  const ownerNode = node || (ifGlyph?.parentNodeGuid ? findNodeByGuid(ifGlyph.parentNodeGuid) : null);
  if (!ownerNode) {
    return [];
  }

  return ownerNode.glyphs.filter((glyph) => glyph.type === 'boolean' && glyph.ownerIfGlyphGuid === ifGlyph.guid);
}

function getLayoutGlyphs(node) {
  return node.glyphs.filter((glyph) => !isOwnedBooleanGlyph(glyph));
}

function getIfElseBooleanLabelOffsets(ifGlyph, glyphScale = 1) {
  const radius = ifGlyph.radius * glyphScale;
  return [
    { x: 0, y: -radius * 0.26 },
    { x: -radius * 0.3, y: radius * 0.2 },
    { x: radius * 0.3, y: radius * 0.2 },
  ];
}

function getIfElseBooleanCornerOffsets(ifGlyph) {
  return [
    { x: 0, y: -ifGlyph.radius },
    { x: -ifGlyph.radius * 0.88, y: ifGlyph.radius * 0.7 },
    { x: ifGlyph.radius * 0.88, y: ifGlyph.radius * 0.7 },
  ];
}

function layoutOwnedBooleans(ifGlyph) {
  const ownerNode = ifGlyph.parentNodeGuid ? findNodeByGuid(ifGlyph.parentNodeGuid) : null;
  if (!ownerNode) {
    return;
  }

  const ownedBooleans = getOwnedBooleans(ifGlyph, ownerNode);
  const offsets = getIfElseBooleanCornerOffsets(ifGlyph);

  ownedBooleans.forEach((glyph, index) => {
    const offset = offsets[index] || offsets[offsets.length - 1];
    glyph.x = ifGlyph.x + offset.x;
    glyph.y = ifGlyph.y + offset.y;
    glyph.radius = ifGlyph.radius * 0.75;
    glyph.lineWidth = ifGlyph.lineWidth;
    glyph.ring = 'inner';
  });
}

function createOutputKey(guid, outputIndex = 0) {
  return `${guid}:${outputIndex}`;
}

function parseOutputKey(outputKey) {
  const [guid, outputIndexText] = String(outputKey).split(':');
  return {
    guid,
    outputIndex: Number.parseInt(outputIndexText ?? '0', 10) || 0,
  };
}

function getGlyphOutputTarget(glyph, outputIndex = 0) {
  if (outputIndex === 1 && glyph.type === 'ifelse') {
    return glyph.nextGlyphGuidFalse ?? null;
  }

  return glyph.nextGlyphGuid ?? null;
}

function getIfElseModeLabel(mode) {
  return mode === 'or' ? 'OR' : 'AND';
}

function getBooleanOperatorLabel(operation) {
  switch (operation) {
    case 'less':
      return 'LT';
    case 'greater':
      return 'GT';
    case 'equal':
      return 'EQ';
    case 'not-equal':
      return 'NE';
    default:
      return 'EQ';
  }
}

function normalizeBooleanOperation(operation) {
  switch (operation) {
    case 'less':
    case 'greater':
    case 'equal':
    case 'not-equal':
      return operation;
    default:
      return 'equal';
  }
}

function getBooleanGlyphLabel(glyph) {
  if (glyph.ring === 'outer') {
    return glyph.checked ? 'TR' : 'FA';
  }

  return getBooleanOperatorLabel(glyph.operation);
}

function getReferenceableGlyphLabel(glyph) {
  if (glyph.type === 'variable') {
    return glyph.name;
  }

  if (glyph.type === 'boolean') {
    return `Boolean ${getBooleanGlyphLabel(glyph)}`;
  }

  return glyph.type;
}

function isClickableGlyph(glyph) {
  if (!glyph) {
    return false;
  }
  const t = glyph.type;
  return t === 'variable'
    || t === 'label'
    || t === 'start'
    || t === 'reference'
    || t === 'goto'
    || t === 'boolean'
    || t === 'ifelse';
}

function getLabelGlyphLabel(glyph) {
  return glyph?.name?.trim() || 'label';
}

function getStartGlyphLabel(glyph) {
  return glyph?.name?.trim() || 'start';
}

function getJumpTargetLabel(glyph) {
  if (!glyph) {
    return '';
  }
  return glyph.type === 'start' ? getStartGlyphLabel(glyph) : getLabelGlyphLabel(glyph);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showTooltip(title, description, clientX, clientY) {
  const normalizedDescription = String(description || '').trim();
  hoverTooltip.innerHTML = normalizedDescription
    ? `
    <span class="hover-tooltip__title">${escapeHtml(title)}</span>
    <span class="hover-tooltip__description">${escapeHtml(normalizedDescription)}</span>
  `
    : `
    <span class="hover-tooltip__title">${escapeHtml(title)}</span>
  `;

  moveTooltip(clientX, clientY);
  hoverTooltip.classList.add('is-visible');
  hoverTooltip.setAttribute('aria-hidden', 'false');
}

function hideTooltip() {
  hoverTooltip.classList.remove('is-visible');
  hoverTooltip.setAttribute('aria-hidden', 'true');
  hoverCanvasGlyphGuid = null;
  hoverIfElseGlyphGuid = null;
}

function moveTooltip(clientX, clientY) {
  const offset = 14;
  const tooltipWidth = hoverTooltip.offsetWidth || 220;
  const tooltipHeight = hoverTooltip.offsetHeight || 60;
  const maxLeft = window.innerWidth - tooltipWidth - 12;
  const maxTop = window.innerHeight - tooltipHeight - 12;
  const left = Math.min(clientX + offset, maxLeft);
  const top = Math.min(clientY + offset, maxTop);

  hoverTooltip.style.left = `${Math.max(12, left)}px`;
  hoverTooltip.style.top = `${Math.max(12, top)}px`;
}

function setMessageLogCollapsed(collapsed) {
  if (!messageLog || !messageLogToggle) {
    return;
  }

  messageLog.dataset.collapsed = collapsed ? 'true' : 'false';
  appShell.dataset.logCollapsed = collapsed ? 'true' : 'false';
  messageLogToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  messageLogToggle.textContent = collapsed ? 'Expand' : 'Collapse';
}

function appendMessageLog(value) {
  if (!messageLogBody) {
    return;
  }

  const line = document.createElement('div');
  line.className = 'message-log__line';
  line.textContent = value === null || value === undefined ? 'null' : String(value);
  messageLogBody.append(line);

  const maxLines = 300;
  while (messageLogBody.childElementCount > maxLines) {
    messageLogBody.firstElementChild?.remove();
  }

  messageLogBody.scrollTop = messageLogBody.scrollHeight;

  // Also mirror to terminal via main process if available
  try {
    window.SpellcircleConsole?.log?.(line.textContent);
  } catch (_) {
    // best-effort only
  }
}

function debugSpellcircle(step, details = {}) {
  if (!spellcircleDebugEnabled) {
    return;
  }

  const payload = {
    source: 'renderer',
    step,
    details,
    timestamp: new Date().toISOString(),
  };

  console.log('[Spellcircle Debug]', payload);

  const detailText = Object.keys(details).length > 0
    ? ` ${JSON.stringify(details)}`
    : '';
  appendMessageLog(`[Spellcircle Debug] ${step}${detailText}`);
}

function getViewportSize() {
  return {
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  };
}

function shouldApplyLineToolToNode(node) {
  const { width, height } = getViewportSize();
  const minDimension = Math.max(1, Math.min(width, height));
  const diameterPixels = node.radius * 2;
  return (diameterPixels / minDimension) >= NODE_LINE_TOOL_MIN_SCREEN_FRACTION;
}

function screenToWorld(screenX, screenY) {
  return {
    x: screenX,
    y: screenY,
  };
}

function applyCameraTransform() {
}

function isLabelHiddenRenderMode(renderMode) {
  return renderMode === RENDER_MODE_CONTEXT
    || renderMode === RENDER_MODE_CHILD_CONTEXT;
}

function isNodeOnlyRenderMode(renderMode) {
  return renderMode === RENDER_MODE_CONTEXT_NODE_ONLY
    || renderMode === RENDER_MODE_CHILD_CONTEXT_NODE_ONLY;
}

function getGlyphStrokeWidth(baseLineWidth, renderMode) {
  if (renderMode === RENDER_MODE_FULL || renderMode === RENDER_MODE_FOCUS) {
    return baseLineWidth * 0.75;
  }

  if (renderMode === RENDER_MODE_CHILD_CONTEXT || renderMode === RENDER_MODE_CHILD_CONTEXT_NODE_ONLY) {
    return baseLineWidth * 0.75 * 0.75;
  }

  return baseLineWidth;
}

function getStrokeWidthForRadius(radius) {
  return BASE_NODE_LINE_WIDTH;
}

function getConnectorRadius(node) {
  return node.radius * CONNECTOR_RADIUS_RATIO;
}

function getScaledValue(node, ratio) {
  return node.radius * ratio;
}

function getNodeShadowBlur(node) {
  return (8 * node.radius) / ROOT_NODE_RADIUS;
}

function createStartGlyph(parentNodeGuid) {
  const glyph = new StartGlyph({ guid: createGuid(), parentNodeGuid, name: 'start' });
  glyph.lineWidth = BASE_NODE_LINE_WIDTH;
  return glyph;
}

function createGlyph(type, parentNodeGuid) {
  const guid = createGuid();
  let glyph = null;

  switch (type) {
    case 'variable':
      glyph = new VariableGlyph({
        guid,
        parentNodeGuid,
        name: createVariableName(),
        value: 'null',
      });
      break;
    case 'value':
      glyph = new ValueGlyph({
        guid,
        parentNodeGuid,
        name: 'Value',
        inputIndex: 1,
      });
      break;
    case 'label':
      glyph = new LabelGlyph({
        guid,
        parentNodeGuid,
        name: createLabelName(),
      });
      break;
    case 'goto':
      glyph = new GotoGlyph({
        guid,
        parentNodeGuid,
        targetLabelGuid: null,
      });
      break;
    case 'reference':
      glyph = new ReferenceGlyph({ guid, parentNodeGuid, referenceGlyphGuid: null });
      break;
    case 'add':
      glyph = new AddGlyph({ guid, parentNodeGuid, operand: '1' });
      break;
    case 'subtract':
      glyph = new SubtractGlyph({ guid, parentNodeGuid, operand: '1' });
      break;
    case 'setvalue':
      glyph = new SetValueGlyph({ guid, parentNodeGuid });
      break;
    case 'output':
      glyph = new OutputGlyph({ guid, parentNodeGuid });
      break;
    case 'boolean':
      glyph = new BooleanGlyph({ guid, parentNodeGuid, operation: 'equal', checked: false });
      break;
    case 'ifelse':
      glyph = new IfElseGlyph({ guid, parentNodeGuid, mode: 'and', nextGlyphGuidFalse: null });
      break;
    default:
      glyph = new Glyph({ guid, type, parentNodeGuid });
      break;
  }

  glyph.nextGlyphGuid = null;
  glyph.nextGlyphGuidIsAuto = false;
  glyph.x = 0;
  glyph.y = 0;
  glyph.radius = CHILD_BASE_RADIUS;
  glyph.lineWidth = BASE_NODE_LINE_WIDTH;
  glyph.ring = 'inner';
  debugSpellcircle('createGlyph', { type, guid: glyph.guid, parentNodeGuid });
  return glyph;
}

function createNode(x, y, radius, parentNodeGuid = null, options = {}) {
  const node = new NodeGlyph({
    guid: createGuid(),
    parentNodeGuid,
    isRoot: Boolean(options.isRoot),
  });
  node.x = x;
  node.y = y;
  node.radius = radius;
  node.lineWidth = getStrokeWidthForRadius(radius);

  node.startGlyph = createStartGlyph(node.guid);
  node.startGlyph.name = (node.isRoot && topLevelNodes.length === 0) ? 'main' : createNodeName();

  if (node.isRoot) {
     const defaultVariable = createGlyph('variable', node.guid);
     defaultVariable.ring = 'outer';
      defaultVariable.name = 'IN';
     node.outerGlyphs.push(defaultVariable);
  } else {
    const defaultValue = createGlyph('value', node.guid);
    defaultValue.ring = 'outer';
    connectOutgoing(defaultValue, node.startGlyph.guid);
    node.outerGlyphs.push(defaultValue);
  }

  updateNodeOrdering(node);
  return node;
}

function isNode(item) {
  return item.type === 'node';
}

function getExecutableSequence(node) {
  return [node.startGlyph, ...getLayoutGlyphs(node)];
}

function updateNodeOrdering(node) {
  getExecutableSequence(node).forEach((item) => {
    item.parentNodeGuid = node.guid;
  });

  node.glyphs.forEach((glyph) => {
    if (isNode(glyph)) {
      updateNodeOrdering(glyph);
    }
  });
}

function getChildRadiusForNode(node, slotCount) {
  if (slotCount <= 1) {
    return getScaledValue(node, CHILD_RADIUS_RATIO);
  }

  const preferredRadius = getScaledValue(node, CHILD_RADIUS_RATIO);
  const minimumRadius = getScaledValue(node, MIN_CHILD_RADIUS_RATIO);
  const borderGap = getScaledValue(node, GROUP_CHILD_BORDER_GAP_RATIO);
  const childGap = getScaledValue(node, GROUP_CHILD_GAP_RATIO);
  const lineGap = getScaledValue(node, GROUP_LINE_GAP_RATIO);
  const minimumLineLength = getScaledValue(node, GROUP_MIN_LINE_LENGTH_RATIO) * (node.parentNodeGuid ? 2 : 1);
  let childRadius = preferredRadius;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const orbitRadius = Math.max(childRadius + borderGap, node.radius - childRadius - borderGap);
    const chordLength = 2 * orbitRadius * Math.sin(Math.PI / slotCount);
    const childLineWidth = getStrokeWidthForRadius(childRadius);
    const reservedSpace = childGap + minimumLineLength + (lineGap * 2) + (childLineWidth * 2);
    const maxRadiusFromSpacing = (chordLength - reservedSpace) / 2;

    childRadius = Math.max(minimumRadius, Math.min(preferredRadius, maxRadiusFromSpacing));
  }

  return childRadius;
}

function layoutNode(node) {
  updateNodeOrdering(node);

  if (getLayoutGlyphs(node).length === 0 && node.outerGlyphs.length === 0) {
    node.layout = null;
    return;
  }

  const layoutGlyphs = getLayoutGlyphs(node);
  const maxGlyphCount = Math.max(layoutGlyphs.length, node.outerGlyphs.length);
  const slotCount = maxGlyphCount + 1;
  const glyphRadius = getChildRadiusForNode(node, slotCount);
  const borderGap = getScaledValue(node, GROUP_CHILD_BORDER_GAP_RATIO);
  const orbitRadius = Math.max(glyphRadius + borderGap, node.radius - glyphRadius - borderGap);
  const lineWidth = getStrokeWidthForRadius(glyphRadius);
  const innerOffsetFromBorder = node.radius - orbitRadius;
  const outerOrbitRadius = node.radius + innerOffsetFromBorder;

  node.layout = {
    orbitRadius,
    outerOrbitRadius,
    glyphRadius,
  };

  node.startGlyph.x = node.x;
  node.startGlyph.y = node.y - orbitRadius;
  node.startGlyph.radius = glyphRadius;
  node.startGlyph.lineWidth = lineWidth;

  layoutGlyphs.forEach((glyph, index) => {
    const angle = START_ANGLE + ((index + 1) * Math.PI * 2) / (layoutGlyphs.length + 1);

    glyph.x = node.x + orbitRadius * Math.cos(angle);
    glyph.y = node.y + orbitRadius * Math.sin(angle);
    glyph.radius = glyphRadius;
    glyph.lineWidth = lineWidth;
    glyph.ring = 'inner';

    if (isNode(glyph)) {
      layoutNode(glyph);
    }

    if (glyph.type === 'ifelse') {
      layoutOwnedBooleans(glyph);
    }
  });

  const innerGlyphByGuid = new Map([node.startGlyph, ...layoutGlyphs, ...node.glyphs.filter(isOwnedBooleanGlyph)].map((glyph) => [glyph.guid, glyph]));
  const pinnedGroups = new Map();
  const unpinnedOuterGlyphs = [];

  node.outerGlyphs.forEach((glyph) => {
    const targetGuid = glyph.nextGlyphGuid;
    const target = targetGuid ? innerGlyphByGuid.get(targetGuid) : null;
    if (target) {
      const group = pinnedGroups.get(targetGuid) || [];
      group.push(glyph);
      pinnedGroups.set(targetGuid, group);
    } else {
      unpinnedOuterGlyphs.push(glyph);
    }
  });

  const getAngleToTarget = (target) => Math.atan2(target.y - node.y, target.x - node.x);
  const clampAngle = (value) => (value + Math.PI * 2) % (Math.PI * 2);
  const angleDistance = (a, b) => {
    const diff = Math.abs(clampAngle(a) - clampAngle(b));
    return Math.min(diff, Math.PI * 2 - diff);
  };

  const pinnedAngles = [];
  const baseSpread = Math.min(0.42, (glyphRadius * 2.6) / outerOrbitRadius);

  for (const [targetGuid, group] of pinnedGroups.entries()) {
    const target = innerGlyphByGuid.get(targetGuid);
    if (!target) {
      continue;
    }

    const baseAngle = getAngleToTarget(target);
    const centerIndex = (group.length - 1) / 2;
    group.forEach((glyph, index) => {
      const angle = baseAngle + (index - centerIndex) * baseSpread;
      pinnedAngles.push(angle);

      glyph.x = node.x + outerOrbitRadius * Math.cos(angle);
      glyph.y = node.y + outerOrbitRadius * Math.sin(angle);
      glyph.radius = glyphRadius;
      glyph.lineWidth = lineWidth;
      glyph.ring = 'outer';
    });
  }

  const unpinnedCount = unpinnedOuterGlyphs.length;
  unpinnedOuterGlyphs.forEach((glyph, index) => {
    let angle = unpinnedCount <= 1
      ? START_ANGLE
      : START_ANGLE + (index * Math.PI * 2) / unpinnedCount;

    for (let tries = 0; tries < 12; tries += 1) {
      const isTooClose = pinnedAngles.some((pinnedAngle) => angleDistance(angle, pinnedAngle) < baseSpread * 0.9);
      if (!isTooClose) {
        break;
      }

      angle += baseSpread;
    }

    glyph.x = node.x + outerOrbitRadius * Math.cos(angle);
    glyph.y = node.y + outerOrbitRadius * Math.sin(angle);
    glyph.radius = glyphRadius;
    glyph.lineWidth = lineWidth;
    glyph.ring = 'outer';
  });
}

function layoutAllNodes() {
  topLevelNodes.forEach((node) => layoutNode(node));
}

function getPrimaryRootNode() {
  return topLevelNodes[0] || null;
}

function getActiveCanvasRoot() {
  if (focusedNode && findNodeByGuid(focusedNode.guid)) {
    return focusedNode;
  }

  focusedNode = getPrimaryRootNode();
  return focusedNode;
}

function getCanvasRoots() {
  const root = getActiveCanvasRoot();
  return root ? [root] : [];
}

function layoutCanvasRoot(root) {
  if (!root) {
    return;
  }

  const { width, height } = getViewportSize();
  root.x = width / 2;
  root.y = height / 2;
  root.radius = ROOT_NODE_RADIUS;
  layoutNode(root);
}

function projectRenderableGlyph(glyph, transform) {
  const projected = Object.assign(Object.create(Object.getPrototypeOf(glyph)), glyph);
  projected.x = transform.anchorX + (glyph.x - transform.sourceX) * transform.scale;
  projected.y = transform.anchorY + (glyph.y - transform.sourceY) * transform.scale;
  projected.radius = glyph.radius * transform.scale;
  projected.lineWidth = getStrokeWidthForRadius(projected.radius) * PARENT_CONTEXT_LINE_WIDTH_MULTIPLIER;
  projected.io = {
    input: null,
    output: null,
    outputs: [],
    param: null,
  };

  if (glyph.layout) {
    projected.layout = {
      orbitRadius: glyph.layout.orbitRadius * transform.scale,
      outerOrbitRadius: glyph.layout.outerOrbitRadius * transform.scale,
      glyphRadius: glyph.layout.glyphRadius * transform.scale,
    };
  }

  if (glyph.startGlyph) {
    projected.startGlyph = projectRenderableGlyph(glyph.startGlyph, transform);
  }

  if (Array.isArray(glyph.glyphs)) {
    projected.glyphs = glyph.glyphs.map((childGlyph) => projectRenderableGlyph(childGlyph, transform));
  }

  if (Array.isArray(glyph.outerGlyphs)) {
    projected.outerGlyphs = glyph.outerGlyphs.map((childGlyph) => projectRenderableGlyph(childGlyph, transform));
  }

  return projected;
}

function drawParentContext(activeRoot) {
  const parentNode = activeRoot?.parentNodeGuid ? findNodeByGuid(activeRoot.parentNodeGuid) : null;
  if (!parentNode) {
    return;
  }

  const anchorX = activeRoot.x;
  const anchorY = activeRoot.y;
  layoutNode(parentNode);
  const focusedNodeInParent = findNodeByGuid(activeRoot.guid, [parentNode]);
  if (!focusedNodeInParent) {
    layoutCanvasRoot(activeRoot);
    return;
  }

  const scale = ROOT_NODE_RADIUS / Math.max(1, focusedNodeInParent.radius);
  const projectedParent = projectRenderableGlyph(parentNode, {
    sourceX: focusedNodeInParent.x,
    sourceY: focusedNodeInParent.y,
    anchorX,
    anchorY,
    scale,
  });

  context.save();
  context.globalAlpha = 0.78;
  hiddenContextNodeGuid = activeRoot.guid;
  drawNodeGlyph(projectedParent, false, RENDER_MODE_CONTEXT);
  hiddenContextNodeGuid = null;
  context.restore();
  layoutCanvasRoot(activeRoot);
}

function drawBackground(width, height) {
  const backgroundGradient = context.createLinearGradient(0, 0, 0, height);
  backgroundGradient.addColorStop(0, 'rgba(240, 224, 187, 0.98)');
  backgroundGradient.addColorStop(1, 'rgba(214, 189, 139, 0.98)');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, width, height);
}

function drawGrid(width, height) {
  context.save();
  context.lineCap = 'butt';

  const drawGridLines = (step, strokeStyle, lineWidth) => {
    const startX = 0;
    const endX = width;
    const startY = 0;
    const endY = height;

    context.beginPath();
    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;

    for (let x = startX; x <= endX; x += step) {
      context.moveTo(x, startY);
      context.lineTo(x, endY);
    }

    for (let y = startY; y <= endY; y += step) {
      context.moveTo(startX, y);
      context.lineTo(endX, y);
    }

    context.stroke();
  };

  drawGridLines(GRID_MINOR_STEP, 'rgba(23, 18, 11, 0.08)', 1);
  drawGridLines(GRID_MAJOR_STEP, 'rgba(23, 18, 11, 0.16)', 1.2);
  context.restore();
}

function drawNodeRing(node) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === node.guid;
  const isCurrentNode = dragState.active && dragState.sourceNode?.guid === node.guid;
  const isCurrentNodeChild = dragState.active && node.parentNodeGuid === dragState.sourceNode?.guid;

  context.save();
  applyCameraTransform();
  context.beginPath();
  context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
  context.lineWidth = isCurrentNodeChild && dragState.sourceNode ? dragState.sourceNode.lineWidth : node.lineWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = isCurrentNode ? '#264f99' : isCurrentNodeChild ? '#2f7d32' : '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = getNodeShadowBlur(node);
  context.stroke();
  context.restore();
}

function drawConnector(node) {
  const radius = getConnectorRadius(node);
  const halfSquare = radius * 0.72;
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === node.guid;
  const isCurrentNode = dragState.active && dragState.sourceNode?.guid === node.guid;
  const connectorAlpha = dragState.active ? 1 : 0.45;

  context.save();
  applyCameraTransform();
  context.lineWidth = node.lineWidth;
  context.globalAlpha *= (isDraggedGlyph ? 0.35 : 1) * connectorAlpha;
  context.strokeStyle = isCurrentNode ? '#a12c2c' : '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = getNodeShadowBlur(node);

  context.strokeRect(node.x - halfSquare, node.y - halfSquare, halfSquare * 2, halfSquare * 2);
  context.beginPath();
  context.moveTo(node.x, node.y - radius);
  context.lineTo(node.x + radius, node.y);
  context.lineTo(node.x, node.y + radius);
  context.lineTo(node.x - radius, node.y);
  context.closePath();
  context.stroke();
  context.restore();
}

function drawStartGlyph(startGlyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === startGlyph.guid;
  const strokeWidth = getGlyphStrokeWidth(startGlyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.beginPath();
  context.moveTo(startGlyph.x, startGlyph.y - startGlyph.radius);
  context.lineTo(startGlyph.x + startGlyph.radius, startGlyph.y);
  context.lineTo(startGlyph.x, startGlyph.y + startGlyph.radius);
  context.lineTo(startGlyph.x - startGlyph.radius, startGlyph.y);
  context.closePath();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * startGlyph.radius / CHILD_BASE_RADIUS;
  context.stroke();
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    drawTextGlyph(startGlyph, getGlyphShortLabel(getStartGlyphLabel(startGlyph), 'S'), 0.6);
  }
  context.restore();
}

function drawNodeGlyph(nodeGlyph, ancestorLineToolActive = true, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === nodeGlyph.guid;
  const nodeLineToolActive = renderMode !== RENDER_MODE_CONTEXT
    && renderMode !== RENDER_MODE_CHILD_CONTEXT
    && renderMode !== RENDER_MODE_CONTEXT_NODE_ONLY
    && renderMode !== RENDER_MODE_CHILD_CONTEXT_NODE_ONLY
    && ancestorLineToolActive
    && lineToolEnabled
    && shouldApplyLineToolToNode(nodeGlyph);

  context.save();
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  drawNodeRing(nodeGlyph);
  if (!isNodeOnlyRenderMode(renderMode)) {
    drawConnector(nodeGlyph);
    drawNodeProgram(nodeGlyph, nodeLineToolActive, renderMode);
  }
  context.restore();
}

function drawPolygonGlyph(glyph, sides, rotation = 0, fill = null) {
  context.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    const x = glyph.x + glyph.radius * Math.cos(angle);
    const y = glyph.y + glyph.radius * Math.sin(angle);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.closePath();
  if (fill) {
    context.fillStyle = fill;
    context.fill();
  }
  context.stroke();
}

function drawStarGlyph(glyph, points, innerRadiusRatio = 0.46, rotation = -Math.PI / 2) {
  context.beginPath();

  for (let index = 0; index < points * 2; index += 1) {
    const angle = rotation + (Math.PI * index) / points;
    const radius = index % 2 === 0 ? glyph.radius : glyph.radius * innerRadiusRatio;
    const x = glyph.x + radius * Math.cos(angle);
    const y = glyph.y + radius * Math.sin(angle);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }

  context.closePath();
  context.stroke();
}

function drawTextGlyph(glyph, text, fontScale = 0.95) {
  context.fillStyle = '#17120b';
  context.font = `${GLYPH_FONT_WEIGHT} ${glyph.radius * fontScale}px ${GLYPH_FONT_FAMILY}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, glyph.x, glyph.y + glyph.radius * 0.04);
}

function drawValueGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  ensureValueGlyphInputIsValid(glyph);
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const text = String(glyph.inputIndex ?? 1);
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  context.beginPath();
  context.moveTo(glyph.x, glyph.y - glyph.radius);
  context.lineTo(glyph.x + glyph.radius, glyph.y);
  context.lineTo(glyph.x, glyph.y + glyph.radius);
  context.lineTo(glyph.x - glyph.radius, glyph.y);
  context.closePath();
  context.stroke();
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    drawTextGlyph(glyph, text, 0.6);
  }
  context.restore();
}

function drawLabelGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  drawPolygonGlyph(glyph, 4, 0);
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    drawTextGlyph(glyph, getGlyphShortLabel(getLabelGlyphLabel(glyph), 'LBL'), 0.38);
  }
  context.restore();
}

function getGotoTarget(glyph) {
  if (!glyph?.targetLabelGuid) {
    return null;
  }

  const target = findGlyphByGuid(glyph.targetLabelGuid);
  return (target?.type === 'label' || target?.type === 'start') ? target : null;
}

function drawGotoGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);
  const gotoTarget = getGotoTarget(glyph);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  drawPolygonGlyph(glyph, 5, -Math.PI / 2);
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    drawTextGlyph(glyph, gotoTarget ? getGlyphShortLabel(getJumpTargetLabel(gotoTarget), 'GO') : 'GO', 0.36);
  }
  context.restore();
}

function drawVariableGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  drawPolygonGlyph(glyph, 6, Math.PI / 6);
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    drawTextGlyph(glyph, getGlyphShortLabel(glyph.name, 'VAR'), 0.42);
  }
  context.restore();
}

function getReferenceTarget(glyph) {
  if (!glyph.referenceGlyphGuid) {
    return null;
  }

  return findGlyphByGuid(glyph.referenceGlyphGuid);
}

function drawReferenceGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const referenceTarget = getReferenceTarget(glyph);
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  drawPolygonGlyph(glyph, 6, Math.PI / 6);
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    const referenceLabel = referenceTarget
      ? (referenceTarget.type === 'boolean'
        ? getBooleanGlyphLabel(referenceTarget)
        : getGlyphShortLabel(referenceTarget.name, 'REF'))
      : 'REF';
    drawTextGlyph(glyph, referenceLabel, 0.42);
  }
  context.restore();
}

function drawMathGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.lineWidth = strokeWidth;
  context.lineCap = 'round';
  const width = glyph.radius * 0.82;
  const topY = glyph.y - glyph.radius * 0.16;
  const underlineY = glyph.y + glyph.radius * 0.55;

  if (glyph.type === 'add') {
    context.beginPath();
    context.moveTo(glyph.x - width / 2, topY);
    context.lineTo(glyph.x + width / 2, topY);
    context.moveTo(glyph.x, topY - glyph.radius * 0.38);
    context.lineTo(glyph.x, topY + glyph.radius * 0.38);
    context.stroke();
  } else if (glyph.type === 'subtract') {
    context.beginPath();
    context.moveTo(glyph.x - width / 2, topY);
    context.lineTo(glyph.x + width / 2, topY);
    context.stroke();
  } else if (glyph.type === 'setvalue') {
    context.beginPath();
    context.moveTo(glyph.x - width / 2, topY - glyph.radius * 0.12);
    context.lineTo(glyph.x + width / 2, topY - glyph.radius * 0.12);
    context.moveTo(glyph.x - width / 2, topY + glyph.radius * 0.12);
    context.lineTo(glyph.x + width / 2, topY + glyph.radius * 0.12);
    context.stroke();
  }

  context.beginPath();
  context.moveTo(glyph.x - width * 0.58, underlineY);
  context.lineTo(glyph.x + width * 0.58, underlineY);
  context.stroke();
  context.restore();
}

function drawOutputGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  drawPolygonGlyph(glyph, 8, Math.PI / 8);
  context.restore();
}

function drawBooleanGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  if (isOwnedBooleanGlyph(glyph) && !isOwnedBooleanVisible(glyph)) {
    return;
  }

  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const textRadius = isOwnedBooleanVisible(glyph) && glyph.radius > 0
    ? glyph.radius / 0.75
    : glyph.radius;
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  drawStarGlyph(glyph, 7, 0.8, -Math.PI / 2);
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    drawTextGlyph({ ...glyph, radius: textRadius }, getBooleanGlyphLabel(glyph), 0.4);
  }
  context.restore();
}

function drawIfElseGlyph(glyph, renderMode = RENDER_MODE_FULL) {
  const isDraggedGlyph = dragState.active && dragState.glyph?.guid === glyph.guid;
  const isHoveredGlyph = hoverIfElseGlyphGuid === glyph.guid;
  const ownedBooleans = getOwnedBooleans(glyph);
  const labelOffsets = getIfElseBooleanLabelOffsets(glyph, 0.72);
  const strokeWidth = getGlyphStrokeWidth(glyph.lineWidth, renderMode);

  context.save();
  applyCameraTransform();
  context.lineWidth = strokeWidth;
  context.globalAlpha *= isDraggedGlyph ? 0.35 : 1;
  context.strokeStyle = '#17120b';
  context.shadowColor = 'rgba(23, 18, 11, 0.12)';
  context.shadowBlur = 8 * glyph.radius / CHILD_BASE_RADIUS;
  context.beginPath();
  context.moveTo(glyph.x, glyph.y - glyph.radius);
  context.lineTo(glyph.x + glyph.radius * 0.88, glyph.y + glyph.radius * 0.7);
  context.lineTo(glyph.x - glyph.radius * 0.88, glyph.y + glyph.radius * 0.7);
  context.closePath();
  context.stroke();
  if (!isLabelHiddenRenderMode(renderMode)) {
    context.shadowBlur = 0;
    if (isHoveredGlyph) {
      drawTextGlyph(glyph, 'IF', 0.42);
    } else {
      ownedBooleans.forEach((booleanGlyph, index) => {
        const offset = labelOffsets[index] || labelOffsets[labelOffsets.length - 1];
        context.fillStyle = '#17120b';
        context.font = `${GLYPH_FONT_WEIGHT} ${glyph.radius * 0.24}px ${GLYPH_FONT_FAMILY}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(getBooleanGlyphLabel(booleanGlyph), glyph.x + offset.x, glyph.y + offset.y);
      });
    }
  }
  context.restore();
}

function drawGlyph(glyph, ancestorLineToolActive = true, renderMode = RENDER_MODE_FULL) {
  if (
    glyph.type === 'node'
    && glyph.guid === hiddenContextNodeGuid
    && (
      renderMode === RENDER_MODE_CONTEXT
      || renderMode === RENDER_MODE_CONTEXT_NODE_ONLY
    )
  ) {
    return;
  }

  switch (glyph.type) {
    case 'node':
      drawNodeGlyph(glyph, ancestorLineToolActive, renderMode);
      break;
    case 'variable':
      drawVariableGlyph(glyph, renderMode);
      break;
    case 'value':
      drawValueGlyph(glyph, renderMode);
      break;
    case 'label':
      drawLabelGlyph(glyph, renderMode);
      break;
    case 'goto':
      drawGotoGlyph(glyph, renderMode);
      break;
    case 'add':
    case 'subtract':
    case 'setvalue':
      drawMathGlyph(glyph, renderMode);
      break;
    case 'reference':
      drawReferenceGlyph(glyph, renderMode);
      break;
    case 'output':
      drawOutputGlyph(glyph, renderMode);
      break;
    case 'boolean':
      drawBooleanGlyph(glyph, renderMode);
      break;
    case 'ifelse':
      drawIfElseGlyph(glyph, renderMode);
      break;
    default:
      break;
  }
}

function getDiamondBoundaryDistance(radius, unitX, unitY) {
  const divisor = Math.abs(unitX) + Math.abs(unitY) || 1;
  return radius / divisor;
}

function getGlyphBoundaryDistance(glyph, unitX, unitY) {
  if (glyph.type === 'start' || glyph.type === 'value') {
    return getDiamondBoundaryDistance(glyph.radius, unitX, unitY);
  }

  return glyph.radius;
}

function getGlyphOuterRadius(glyph, unitX, unitY) {
  return getGlyphBoundaryDistance(glyph, unitX, unitY) + glyph.lineWidth / 2;
}

function drawNodeConnections(node, nodeLineToolActive, renderMode = RENDER_MODE_FULL) {
  if (!node.layout) {
    return;
  }

  const execGlyphs = [node.startGlyph, ...node.glyphs];
  const execMap = new Map(execGlyphs.map((glyph) => [glyph.guid, glyph]));
  const lineGap = getScaledValue(node, GROUP_LINE_GAP_RATIO);

  context.save();
  applyCameraTransform();
  context.strokeStyle = 'rgba(23, 18, 11, 0.45)';
  context.lineCap = 'round';
  context.shadowColor = 'rgba(23, 18, 11, 0.08)';
  context.shadowBlur = 6 * node.radius / ROOT_NODE_RADIUS;

  const inputPoints = new Map();
  const outputPoints = new Map();
  const paramInputPoints = new Map();
  const outgoingLineEndSquares = new Map();

  const drawConnectionSegment = (fromGlyph, toX, toY, kind = 'normal') => {
    const dx = toX - fromGlyph.x;
    const dy = toY - fromGlyph.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) {
      return null;
    }

    const unitX = dx / distance;
    const unitY = dy / distance;
    const currentOffset = getGlyphOuterRadius(fromGlyph, unitX, unitY) + lineGap;
    const lineStartX = fromGlyph.x + unitX * currentOffset;
    const lineStartY = fromGlyph.y + unitY * currentOffset;

    context.beginPath();
    context.lineWidth = node.lineWidth;
    context.moveTo(lineStartX, lineStartY);
    context.lineTo(toX, toY);
    context.stroke();
    drawEndSquare(toX, toY);

    if (nodeLineToolActive) {
      outputPoints.set(fromGlyph.guid, new IOConnector({
        x: lineStartX,
        y: lineStartY,
        kind: 'output',
        ownerGuid: fromGlyph.guid,
      }));
      outgoingLineEndSquares.set(fromGlyph.guid, { x: toX, y: toY });
      if (kind === 'normal') {
        const targetGuid = execMap.get(fromGlyph.nextGlyphGuid)?.guid;
        if (targetGuid) {
          inputPoints.set(targetGuid, new IOConnector({
            x: toX,
            y: toY,
            kind: 'input',
            ownerGuid: targetGuid,
          }));
        }
      }
    }

    return { x: lineStartX, y: lineStartY };
  };

  const drawEndSquare = (endX, endY) => {
    if (!nodeLineToolActive) {
      return;
    }

    const squareSize = Math.max(node.lineWidth * 3.2, node.radius * 0.05);
    context.save();
    context.fillStyle = 'rgba(23, 18, 11, 0.45)';
    context.shadowBlur = 0;
    context.fillRect(endX - squareSize / 2, endY - squareSize / 2, squareSize, squareSize);
    context.restore();
  };

  const drawIoCircle = (x, y, dashed, kind, filled = false, sizeScale = 1) => {
    const circleRadius = Math.max(node.lineWidth * 2.3, node.radius * 0.036) * sizeScale;
    const circleLineWidth = node.lineWidth;

    context.save();
    context.lineWidth = circleLineWidth;
    if (filled) {
      context.strokeStyle = 'rgba(23, 18, 11, 0.45)';
      context.fillStyle = 'rgba(23, 18, 11, 0.45)';
    } else if (kind === 'param-input') {
      context.strokeStyle = 'rgba(205, 125, 28, 0.8)';
    } else if (kind === 'outer-output') {
      context.strokeStyle = 'rgba(205, 125, 28, 0.8)';
    } else if (kind === 'secondary-output') {
      context.strokeStyle = 'rgba(23, 18, 11, 0.9)';
    } else if (kind === 'output') {
      context.strokeStyle = 'rgba(160, 35, 35, 0.8)';
    } else {
      context.strokeStyle = 'rgba(45, 95, 170, 0.8)';
    }
    context.shadowBlur = 0;

    if (!filled && dashed) {
      context.setLineDash([circleLineWidth * 1.95, circleLineWidth * 1.8]);
    } else {
      context.setLineDash([]);
    }

    context.beginPath();
    context.arc(x, y, circleRadius, 0, Math.PI * 2);
    if (filled) {
      context.fill();
    } else {
      context.stroke();
    }
    context.restore();
  };

  const circleOffset = Math.max(node.lineWidth * 2.6, node.radius * 0.03);
  const circleRadius = Math.max(node.lineWidth * 2.3, node.radius * 0.036);
  const showIoMarkers = lineToolEnabled;
  const ownedBooleans = node.glyphs.filter(isOwnedBooleanGlyph);
  const ringGlyphs = [...execGlyphs, ...node.outerGlyphs, ...ownedBooleans];

  const glyphByGuid = new Map(ringGlyphs.map((glyph) => [glyph.guid, glyph]));
  const inputSourceByTarget = new Map();
  const outputTargetBySource = new Map();
  const paramSourceByTarget = new Map();

  execGlyphs.forEach((glyph) => {
    if (glyph.nextGlyphGuid) {
      outputTargetBySource.set(createOutputKey(glyph.guid, 0), glyph.nextGlyphGuid);
      inputSourceByTarget.set(glyph.nextGlyphGuid, glyph.guid);
    }

    if (glyph.type === 'ifelse' && glyph.nextGlyphGuidFalse) {
      outputTargetBySource.set(createOutputKey(glyph.guid, 1), glyph.nextGlyphGuidFalse);
      inputSourceByTarget.set(glyph.nextGlyphGuidFalse, glyph.guid);
    }
  });

  node.outerGlyphs.forEach((glyph) => {
    if (glyph.nextGlyphGuid) {
      outputTargetBySource.set(createOutputKey(glyph.guid, 0), glyph.nextGlyphGuid);
      paramSourceByTarget.set(glyph.nextGlyphGuid, glyph.guid);
    }
  });

  ringGlyphs.forEach((glyph) => {
    const isOuterDataGlyph = glyph.ring === 'outer' && isOuterParamGlyphType(glyph.type);
    const isOwnedBoolean = isOwnedBooleanGlyph(glyph);

    const inputSourceGuid = inputSourceByTarget.get(glyph.guid) || null;
    const outputTargetGuid = outputTargetBySource.get(createOutputKey(glyph.guid, 0)) || null;
    const paramSourceGuid = paramSourceByTarget.get(glyph.guid) || null;

    const inputSource = inputSourceGuid ? glyphByGuid.get(inputSourceGuid) : null;
    const outputTarget = outputTargetGuid ? glyphByGuid.get(outputTargetGuid) : null;
    const paramSource = paramSourceGuid ? glyphByGuid.get(paramSourceGuid) : null;

    const showAllIO = nodeLineToolActive;
    const hasInputConnection = Boolean(inputSourceGuid);
    const hasOutputConnection = Boolean(outputTargetGuid)
      || Boolean(outputTargetBySource.get(createOutputKey(glyph.guid, 1)));
    const hasParamConnection = Boolean(paramSourceGuid);
    const allowParam = glyph.type === 'node'
      || glyph.type === 'add'
      || glyph.type === 'subtract'
      || glyph.type === 'setvalue'
      || glyph.type === 'boolean'
      || glyph.type === 'ifelse';
    const allowOutput = glyph.type !== 'goto';
    const resolvedInputSource = glyph.type === 'start' ? (paramSource || inputSource) : inputSource;
    const outputAngles = glyph.type === 'ifelse'
      ? [Math.PI / 2 - 0.48, Math.PI / 2 + 0.48]
      : null;
    const isOuterBooleanGlyph = glyph.type === 'boolean' && glyph.ring === 'outer';

    glyph.updateIOLayout({
      inputSource: resolvedInputSource,
      outputTarget,
      paramSource,
      circleOffset,
      circleRadius,
      allowInput: !isOuterDataGlyph
        && !isOwnedBoolean
        && !isOuterBooleanGlyph
        && (showAllIO || hasInputConnection || (glyph.type === 'start' && hasParamConnection)),
      allowOutput: allowOutput && !isOwnedBoolean && (showAllIO || hasOutputConnection),
      allowParam: !isOwnedBoolean && !isOuterBooleanGlyph && allowParam && (showAllIO || hasParamConnection),
      outputAngles,
    });
  });

  const drawConnectionLine = (fromGlyph, fromPoint, toPoint, kind = 'normal') => {
    if (!fromPoint || !toPoint) {
      return;
    }

    context.save();
    if ((fromPoint.outputIndex ?? 0) === 1) {
      context.strokeStyle = 'rgba(23, 18, 11, 0.9)';
    }
    context.beginPath();
    context.lineWidth = node.lineWidth;
    context.moveTo(fromPoint.x, fromPoint.y);
    context.lineTo(toPoint.x, toPoint.y);
    context.stroke();
    drawEndSquare(toPoint.x, toPoint.y);
    context.restore();

    if (nodeLineToolActive && fromGlyph?.guid) {
      if (fromPoint.kind === 'output') {
        outputPoints.set(createOutputKey(fromGlyph.guid, fromPoint.outputIndex ?? 0), fromPoint);
      }
      if (kind === 'normal') {
        inputPoints.set(toPoint.ownerGuid, toPoint);
      } else {
        paramInputPoints.set(toPoint.ownerGuid, toPoint);
      }
      outgoingLineEndSquares.set(createOutputKey(fromGlyph.guid, fromPoint.outputIndex ?? 0), { x: toPoint.x, y: toPoint.y });
    }
  };

  execGlyphs.forEach((glyph) => {
    const targetGuid = outputTargetBySource.get(createOutputKey(glyph.guid, 0));
    const targetGlyph = targetGuid ? glyphByGuid.get(targetGuid) : null;
    if (targetGlyph) {
      drawConnectionLine(glyph, glyph.io?.output, targetGlyph.io?.input, 'normal');
    }

    if (glyph.type === 'ifelse') {
      const falseTargetGuid = outputTargetBySource.get(createOutputKey(glyph.guid, 1));
      const falseTargetGlyph = falseTargetGuid ? glyphByGuid.get(falseTargetGuid) : null;
      if (falseTargetGlyph && glyph.io?.outputs?.[1]) {
        drawConnectionLine(glyph, glyph.io.outputs[1], falseTargetGlyph.io?.input, 'normal');
      }
    }
  });

  node.outerGlyphs.forEach((glyph) => {
    if (!glyph.nextGlyphGuid) {
      return;
    }

    const targetGuid = glyph.nextGlyphGuid;
    const targetGlyph = glyphByGuid.get(targetGuid);
    if (!targetGlyph) {
      return;
    }

    const targetPoint = targetGlyph.io?.param || targetGlyph.io?.input;
    drawConnectionLine(glyph, glyph.io?.output, targetPoint, 'param');
  });

  ringGlyphs.forEach((glyph) => {
      const isOuterDataGlyph = glyph.ring === 'outer' && isOuterParamGlyphType(glyph.type);

      const isConnectedInput = Boolean(inputSourceByTarget.get(glyph.guid));
      const isConnectedOutput = Boolean(outputTargetBySource.get(glyph.guid));
      const isConnectedParam = Boolean(paramSourceByTarget.get(glyph.guid));

      if (
        showIoMarkers
        && renderMode !== RENDER_MODE_CONTEXT
        && renderMode !== RENDER_MODE_CHILD_CONTEXT
        && renderMode !== RENDER_MODE_CHILD_CONTEXT_NODE_ONLY
        && glyph.io?.input
        && !isOuterDataGlyph
      ) {
        if (glyph.type === 'start') {
          drawIoCircle(
            glyph.io.input.x,
            glyph.io.input.y,
            false,
            'param-input',
            false,
            !nodeLineToolActive ? 0.7 : 1,
          );
          paramInputPoints.set(glyph.guid, glyph.io.input);
        } else {
          drawIoCircle(
            glyph.io.input.x,
            glyph.io.input.y,
            true,
            'input',
            false,
            !nodeLineToolActive ? 0.7 : 1,
          );
          inputPoints.set(glyph.guid, glyph.io.input);
        }
      }

      const outputConnectors = glyph.io?.outputs?.length ? glyph.io.outputs : (glyph.io?.output ? [glyph.io.output] : []);
      outputConnectors.forEach((outputConnector, index) => {
        const outputKey = createOutputKey(glyph.guid, outputConnector.outputIndex ?? index);
        if (
          showIoMarkers
          && renderMode !== RENDER_MODE_CONTEXT
          && renderMode !== RENDER_MODE_CHILD_CONTEXT
          && renderMode !== RENDER_MODE_CHILD_CONTEXT_NODE_ONLY
        ) {
          const outputKind = isOuterDataGlyph
            ? 'outer-output'
            : ((outputConnector.outputIndex ?? index) === 1 ? 'secondary-output' : 'output');
          drawIoCircle(
            outputConnector.x,
            outputConnector.y,
            true,
            outputKind,
            false,
            !nodeLineToolActive ? 0.7 : 1,
          );
        }

        outputPoints.set(outputKey, outputConnector);
      });

      if (
        showIoMarkers
        && renderMode !== RENDER_MODE_CONTEXT
        && renderMode !== RENDER_MODE_CHILD_CONTEXT
        && renderMode !== RENDER_MODE_CHILD_CONTEXT_NODE_ONLY
        && glyph.io?.param
      ) {
        drawIoCircle(
          glyph.io.param.x,
          glyph.io.param.y,
          false,
          'param-input',
          false,
          !nodeLineToolActive ? 0.7 : 1,
        );
        paramInputPoints.set(glyph.guid, glyph.io.param);
      }
    });

  if (nodeLineToolActive) {
    node.__lineToolCache = {
      execGlyphGuids: execGlyphs.map((glyph) => glyph.guid),
      outputSourceGuids: ringGlyphs.flatMap((glyph) => getGlyphOutputPoints(node, glyph, { circleOffset }).map((outputPoint) => createOutputKey(glyph.guid, outputPoint.outputIndex ?? 0))),
      outputPoints,
      inputPoints,
      paramInputPoints,
      endSquares: outgoingLineEndSquares,
      circleOffset,
      circleRadius,
    };
  }

  context.restore();
}

function drawNodeProgram(node, nodeLineToolActive, renderMode = RENDER_MODE_FULL) {
  if (!node.layout) {
    return;
  }

  const layoutGlyphs = getLayoutGlyphs(node);

  if (!nodeLineToolActive) {
    node.__lineToolCache = null;
  }

  drawNodeConnections(node, nodeLineToolActive, renderMode);
  drawStartGlyph(node.startGlyph, renderMode);
  node.glyphs.forEach((glyph) => {
    let glyphRenderMode = renderMode;
    if (isNode(glyph)) {
      if (renderMode === RENDER_MODE_FOCUS) {
        glyphRenderMode = RENDER_MODE_CHILD_CONTEXT;
      } else if (renderMode === RENDER_MODE_CONTEXT) {
        glyphRenderMode = RENDER_MODE_CONTEXT_NODE_ONLY;
      } else if (renderMode === RENDER_MODE_CHILD_CONTEXT) {
        glyphRenderMode = RENDER_MODE_CHILD_CONTEXT_NODE_ONLY;
      }
    } else if (renderMode === RENDER_MODE_FOCUS) {
      glyphRenderMode = RENDER_MODE_FULL;
    } else if (renderMode === RENDER_MODE_CHILD_CONTEXT) {
      glyphRenderMode = RENDER_MODE_CHILD_CONTEXT;
    }

    drawGlyph(glyph, nodeLineToolActive, glyphRenderMode);
  });
  node.outerGlyphs.forEach((glyph) => drawGlyph(
    glyph,
    nodeLineToolActive,
    renderMode === RENDER_MODE_FOCUS ? RENDER_MODE_FULL : renderMode,
  ));
}

function drawGhostGlyph() {
  if (!dragState.active || !dragState.glyph) {
    return;
  }

  const ghostGlyph = {
    ...dragState.glyph,
    x: dragState.worldX,
    y: dragState.worldY,
    lineWidth: dragState.glyph.lineWidth,
  };

  context.save();
  context.globalAlpha = 0.55;

  if (ghostGlyph.type === 'node') {
    const ghostNode = {
      ...ghostGlyph,
      glyphs: [],
      layout: null,
    };
    drawNodeRing(ghostNode);
    drawConnector(ghostNode);
  } else {
    switch (ghostGlyph.type) {
      case 'variable':
        drawVariableGlyph(ghostGlyph);
        break;
      case 'value':
        drawValueGlyph(ghostGlyph);
        break;
      case 'add':
      case 'subtract':
      case 'setvalue':
        drawMathGlyph(ghostGlyph);
        break;
      case 'output':
        drawOutputGlyph(ghostGlyph);
        break;
      case 'boolean':
        drawBooleanGlyph(ghostGlyph);
        break;
      case 'ifelse':
        drawIfElseGlyph(ghostGlyph);
        break;
      default:
        break;
    }
  }

  context.restore();
}

function drawGhostWire() {
  if (!wireDragState.active || !wireDragState.node || !wireDragState.fromPoint || !wireDragState.toWorld) {
    return;
  }

  const start = wireDragState.fromPoint;
  const end = wireDragState.toWorld;
  const node = wireDragState.node;
  const lineWidth = node.lineWidth;

  context.save();
  applyCameraTransform();
  context.globalAlpha *= 0.75;
  context.strokeStyle = 'rgba(23, 18, 11, 0.45)';
  context.lineWidth = lineWidth;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  if (lineToolEnabled) {
    const squareSize = Math.max(node.lineWidth * 3.2, node.radius * 0.05);
    context.fillStyle = 'rgba(23, 18, 11, 0.45)';
    context.fillRect(end.x - squareSize / 2, end.y - squareSize / 2, squareSize, squareSize);
  }

  context.restore();
}

function drawScene() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const canvasRoots = getCanvasRoots();

  canvasRoots.forEach((node) => layoutCanvasRoot(node));

  context.clearRect(0, 0, width, height);
  drawBackground(width, height);
  drawGrid(width, height);
  canvasRoots.forEach((node) => {
    drawParentContext(node);
    drawNodeGlyph(node, true, RENDER_MODE_FOCUS);
  });
  drawGhostGlyph();
  drawGhostWire();
}

function findNodeHit(node, worldX, worldY) {
  for (let index = node.glyphs.length - 1; index >= 0; index -= 1) {
    const glyph = node.glyphs[index];
    if (isNode(glyph)) {
      const nested = findNodeHit(glyph, worldX, worldY);
      if (nested) {
        return nested;
      }
    }
  }

  const distance = Math.hypot(worldX - node.x, worldY - node.y);
  return distance <= node.radius ? node : null;
}

function findDropTarget(worldX, worldY) {
  const canvasRoots = getCanvasRoots();
  for (let index = canvasRoots.length - 1; index >= 0; index -= 1) {
    const match = findNodeHit(canvasRoots[index], worldX, worldY);
    if (match) {
      return match;
    }
  }

  return null;
}

function findDirectChildNodeHit(node, worldX, worldY, excludedGuid = null) {
  for (let index = node.glyphs.length - 1; index >= 0; index -= 1) {
    const glyph = node.glyphs[index];

    if (!isNode(glyph) || glyph.guid === excludedGuid) {
      continue;
    }

    if (Math.hypot(worldX - glyph.x, worldY - glyph.y) <= glyph.radius) {
      return glyph;
    }
  }

  return null;
}

function removeGlyphFromNode(node, glyphGuid) {
  const innerIndex = node.glyphs.findIndex((glyph) => glyph.guid === glyphGuid);
  debugSpellcircle('removeGlyphFromNode', { nodeGuid: node.guid, glyphGuid, innerIndex });
  if (innerIndex !== -1) {
    const removedGlyph = node.glyphs.splice(innerIndex, 1)[0];
    if (removedGlyph?.type === 'ifelse') {
      node.glyphs.forEach((glyph) => {
        if (glyph.type === 'boolean' && glyph.ownerIfGlyphGuid === removedGlyph.guid) {
          glyph.ownerIfGlyphGuid = null;
        }
      });
    }
    return removedGlyph;
  }

  const outerIndex = node.outerGlyphs.findIndex((glyph) => glyph.guid === glyphGuid);
  if (outerIndex !== -1) {
    return node.outerGlyphs.splice(outerIndex, 1)[0];
  }
  return null;
}

function insertGlyphIntoNode(node, glyph, index, layer = 'inner') {
  glyph.parentNodeGuid = node.guid;

  if (layer === 'outer') {
    glyph.ring = 'outer';
    node.outerGlyphs.splice(index, 0, glyph);
    return;
  }

  glyph.ring = 'inner';
  node.glyphs.splice(index, 0, glyph);
}

function appendGlyphIntoNode(node, glyph, layer = 'inner') {
  if (layer === 'outer') {
    insertGlyphIntoNode(node, glyph, node.outerGlyphs.length, layer);
    return;
  }

  insertGlyphIntoNode(node, glyph, node.glyphs.length, layer);
}

function deleteDraggedGlyph(glyph, sourceNode) {
  if (isNode(glyph)) {
    openDeleteModal(glyph, sourceNode);
    return;
  }

  removeGlyphFromNode(sourceNode, glyph.guid);
  layoutAllNodes();
  drawScene();
}

function getInsertionIndexForRing(centerX, centerY, count, worldX, worldY, reservedGap) {
  if (count === 0) {
    return 0;
  }

  const angle = Math.atan2(worldY - centerY, worldX - centerX);
  const normalizedAngle = (angle - START_ANGLE + Math.PI * 2) % (Math.PI * 2);
  const sectorSize = reservedGap ? (Math.PI * 2) / (count + 1) : (Math.PI * 2) / count;
  return Math.min(count, Math.floor(normalizedAngle / sectorSize));
}

function getRingDropZone(node, worldX, worldY) {
  if (!node.layout) {
    return null;
  }

  const distance = Math.hypot(worldX - node.x, worldY - node.y);
  const bandThickness = node.layout.glyphRadius * 1.4;

  if (Math.abs(distance - node.layout.outerOrbitRadius) <= bandThickness) {
    return 'outer';
  }

  if (Math.abs(distance - node.layout.orbitRadius) <= bandThickness) {
    return 'inner';
  }

  return null;
}

function finishGlyphDrag(worldX, worldY) {
  const { glyph, sourceNode } = dragState;
  if (!glyph || !sourceNode) {
    return;
  }

  const parentNode = sourceNode.parentNodeGuid ? findNodeByGuid(sourceNode.parentNodeGuid) : null;
  const childNodeTarget = findDirectChildNodeHit(sourceNode, worldX, worldY, glyph.guid);
  const ifElseTarget = glyph.type === 'boolean'
    ? sourceNode.glyphs.find((candidate) => candidate.type === 'ifelse' && isPointInsideGlyph(candidate, worldX, worldY)) || null
    : null;

  if (isPointInsideConnector(sourceNode, worldX, worldY)) {
    deleteDraggedGlyph(glyph, sourceNode);
    return;
  }

  removeGlyphFromNode(sourceNode, glyph.guid);
  if (glyph.type === 'boolean') {
    glyph.ownerIfGlyphGuid = null;
  }

  if (ifElseTarget && getOwnedBooleans(ifElseTarget, sourceNode).length < 3) {
    glyph.ownerIfGlyphGuid = ifElseTarget.guid;
    appendGlyphIntoNode(sourceNode, glyph, 'inner');
    layoutAllNodes();
    drawScene();
    return;
  }

  if (childNodeTarget) {
    appendGlyphIntoNode(childNodeTarget, glyph, isOuterParamGlyphType(glyph.type) ? 'outer' : 'inner');
  } else {
    const ringZone = getRingDropZone(sourceNode, worldX, worldY);

    if (ringZone) {
      const wantsOuter = ringZone === 'outer' && isOuterParamGlyphType(glyph.type);
      const forcedOuter = glyph.type === 'value';
      const layer = forcedOuter ? 'outer' : wantsOuter ? 'outer' : 'inner';
      const count = layer === 'outer' ? sourceNode.outerGlyphs.length : getLayoutGlyphs(sourceNode).length;
      const insertionIndex = getInsertionIndexForRing(sourceNode.x, sourceNode.y, count, worldX, worldY, layer === 'inner');
      insertGlyphIntoNode(sourceNode, glyph, insertionIndex, layer);
    } else if (Math.hypot(worldX - sourceNode.x, worldY - sourceNode.y) > sourceNode.radius) {
    if (parentNode) {
      appendGlyphIntoNode(parentNode, glyph, isOuterParamGlyphType(glyph.type) ? 'outer' : 'inner');
    } else {
      appendGlyphIntoNode(sourceNode, glyph, isOuterParamGlyphType(glyph.type) ? 'outer' : 'inner');
    }
    } else {
      if (glyph.type === 'value') {
        appendGlyphIntoNode(sourceNode, glyph, 'outer');
      } else {
        const insertionIndex = getInsertionIndexForRing(sourceNode.x, sourceNode.y, getLayoutGlyphs(sourceNode).length, worldX, worldY, true);
        insertGlyphIntoNode(sourceNode, glyph, insertionIndex, 'inner');
      }
    }
  }

  layoutAllNodes();
  drawScene();
}

function clearGlyphDrag() {
  dragState.active = false;
  dragState.moved = false;
  dragState.pointerId = null;
  dragState.glyph = null;
  dragState.sourceNode = null;
  dragState.worldX = 0;
  dragState.worldY = 0;
}

function isPointInsideConnector(node, worldX, worldY) {
  const radius = getConnectorRadius(node);
  const localX = worldX - node.x;
  const localY = worldY - node.y;
  const halfSquare = radius * 0.72;
  return (Math.abs(localX) <= halfSquare && Math.abs(localY) <= halfSquare)
    || (Math.abs(localX) + Math.abs(localY) <= radius);
}

function findConnectorTarget(node, worldX, worldY, depth = 0, maxDepth = Number.POSITIVE_INFINITY) {
  for (let index = node.glyphs.length - 1; index >= 0; index -= 1) {
    const glyph = node.glyphs[index];
    if (isNode(glyph) && depth < maxDepth) {
      const nested = findConnectorTarget(glyph, worldX, worldY, depth + 1, maxDepth);
      if (nested) {
        return nested;
      }
    }
  }

  return isPointInsideConnector(node, worldX, worldY) ? node : null;
}

function isPointInsideTriangleGlyph(glyph, worldX, worldY) {
  const localX = worldX - glyph.x;
  const localY = worldY - glyph.y;
  if (localY < -glyph.radius || localY > glyph.radius * 0.9) {
    return false;
  }

  const normalizedY = (localY + glyph.radius) / (glyph.radius * 1.9);
  const halfWidth = glyph.radius * (0.08 + normalizedY * 0.84);
  return Math.abs(localX) <= halfWidth;
}

function isPointInsideDiamondGlyph(glyph, worldX, worldY) {
  const localX = Math.abs(worldX - glyph.x);
  const localY = Math.abs(worldY - glyph.y);
  return (localX + localY) <= glyph.radius;
}

function isPointInsideOctagonGlyph(glyph, worldX, worldY) {
  const localX = Math.abs(worldX - glyph.x);
  const localY = Math.abs(worldY - glyph.y);
  const r = glyph.radius;
  return localX <= r && localY <= r && localX + localY <= r * 1.62;
}

function isPointInsideGlyph(glyph, worldX, worldY) {
  if (isNode(glyph)) {
    return Math.hypot(worldX - glyph.x, worldY - glyph.y) <= glyph.radius;
  }

  if (glyph.type === 'ifelse') {
    return isPointInsideTriangleGlyph(glyph, worldX, worldY);
  }

  if (glyph.type === 'start') {
    return isPointInsideDiamondGlyph(glyph, worldX, worldY);
  }

  if (isOwnedBooleanGlyph(glyph) && !isOwnedBooleanVisible(glyph)) {
    return false;
  }

  if (glyph.type === 'variable' || glyph.type === 'value' || glyph.type === 'reference') {
    return Math.hypot(worldX - glyph.x, worldY - glyph.y) <= glyph.radius;
  }

  if (glyph.type === 'output') {
    return isPointInsideOctagonGlyph(glyph, worldX, worldY);
  }

  return Math.hypot(worldX - glyph.x, worldY - glyph.y) <= glyph.radius;
}

function findGlyphHit(node, worldX, worldY, predicate = () => true) {
  const combinedGlyphs = [...node.outerGlyphs, ...node.glyphs];

  for (let index = combinedGlyphs.length - 1; index >= 0; index -= 1) {
    const glyph = combinedGlyphs[index];

    if (isOwnedBooleanGlyph(glyph) && !isOwnedBooleanVisible(glyph)) {
      continue;
    }

    if (isNode(glyph)) {
      const nested = findGlyphHit(glyph, worldX, worldY, predicate);
      if (nested) {
        return nested;
      }
    }

    if (predicate(glyph) && isPointInsideGlyph(glyph, worldX, worldY)) {
      return glyph;
    }
  }

  if (predicate(node.startGlyph) && isPointInsideGlyph(node.startGlyph, worldX, worldY)) {
    return node.startGlyph;
  }

  return null;
}

function findCanvasGlyph(worldX, worldY, predicate = () => true) {
  const canvasRoots = getCanvasRoots();
  for (let index = canvasRoots.length - 1; index >= 0; index -= 1) {
    const glyph = findGlyphHit(canvasRoots[index], worldX, worldY, predicate);
    if (glyph) {
      return glyph;
    }
  }

  return null;
}

function getGlyphTooltip(glyph) {
  switch (glyph.type) {
    case 'variable':
      return { title: glyph.name, description: `Value: ${glyph.value}` };
    case 'label':
      return { title: 'Label', description: `Name: ${getLabelGlyphLabel(glyph)}` };
    case 'goto': {
      const target = getGotoTarget(glyph);
      return { title: 'Goto', description: target ? `Target: ${getJumpTargetLabel(target)}` : 'Target: none' };
    }
    case 'add':
      return { title: 'Add', description: `Operand: ${glyph.operand}` };
    case 'subtract':
      return { title: 'Subtract', description: `Operand: ${glyph.operand}` };
    case 'setvalue':
      return { title: 'Set Value', description: 'Sets previous variable/reference to Param input.' };
    case 'reference': {
      const target = getReferenceTarget(glyph);
      return { title: 'Reference', description: target ? `Target: ${getReferenceableGlyphLabel(target)}` : 'Target: none' };
    }
    case 'output':
      return { title: 'Output', description: 'Logs the current value to the console.' };
    case 'boolean':
      return glyph.ring === 'outer'
        ? { title: 'Boolean', description: `Literal: ${glyph.checked ? 'true' : 'false'}` }
        : { title: 'Boolean', description: `Operator: ${getBooleanOperatorLabel(glyph.operation)}` };
    case 'ifelse':
      return { title: 'If / Else', description: `Mode: ${getIfElseModeLabel(glyph.mode)}. First output is pass, second output is fail.` };
    case 'value':
      return { title: glyph.name, description: '' };
    default:
      return null;
  }
}

function focusNode(node) {
  focusedNode = node;
  drawScene();
}

function updateCanvasHover(clientX, clientY) {
  const previousHoverIfElseGlyphGuid = hoverIfElseGlyphGuid;

  if (
    panState.active
    || dragState.active
    || wireDragState.active
    || activeValueDropdown
    || activeGotoDropdown
    || variableModalBackdrop.classList.contains('is-visible')
    || labelModalBackdrop.classList.contains('is-visible')
    || referenceModalBackdrop.classList.contains('is-visible')
    || booleanModalBackdrop.classList.contains('is-visible')
    || ifElseModalBackdrop.classList.contains('is-visible')
    || deleteModalBackdrop.classList.contains('is-visible')
  ) {
    canvas.classList.remove('is-connector-hover');
    canvas.classList.remove('is-glyph-hover');
    hideTooltip();
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const worldPoint = screenToWorld(clientX - rect.left, clientY - rect.top);
  let connectorTarget = null;
  const canvasRoots = getCanvasRoots();
  const maxConnectorDepth = focusedNode ? 1 : Number.POSITIVE_INFINITY;
  for (let index = canvasRoots.length - 1; index >= 0; index -= 1) {
    connectorTarget = findConnectorTarget(canvasRoots[index], worldPoint.x, worldPoint.y, 0, maxConnectorDepth);
    if (connectorTarget) {
      break;
    }
  }

  canvas.classList.toggle('is-connector-hover', Boolean(connectorTarget));

  const hoverGlyph = findCanvasGlyph(worldPoint.x, worldPoint.y, (glyph) => isClickableGlyph(glyph));
  canvas.classList.toggle('is-glyph-hover', Boolean(hoverGlyph));
  if (hoverGlyph) {
    hoverCanvasGlyphGuid = hoverGlyph.guid;
    hoverIfElseGlyphGuid = hoverGlyph.type === 'ifelse'
      ? hoverGlyph.guid
      : (isOwnedBooleanGlyph(hoverGlyph) ? hoverGlyph.ownerIfGlyphGuid : null);
    if (previousHoverIfElseGlyphGuid !== hoverIfElseGlyphGuid) {
      drawScene();
    }
    const tooltip = getGlyphTooltip(hoverGlyph);
    if (tooltip) {
      showTooltip(tooltip.title, tooltip.description, clientX, clientY);
      return;
    }
  }

  if (hoverCanvasGlyphGuid) {
    hideTooltip();
  }

  hoverCanvasGlyphGuid = null;
  hoverIfElseGlyphGuid = null;
  canvas.classList.remove('is-glyph-hover');
  if (previousHoverIfElseGlyphGuid !== hoverIfElseGlyphGuid) {
    drawScene();
  }
}

function getDeepestNodeAt(worldX, worldY) {
  return findDropTarget(worldX, worldY);
}

function findLineToolStartTargetInNode(node, worldX, worldY) {
  for (let index = node.glyphs.length - 1; index >= 0; index -= 1) {
    const glyph = node.glyphs[index];
    if (isNode(glyph)) {
      const nestedTarget = findLineToolStartTargetInNode(glyph, worldX, worldY);
      if (nestedTarget) {
        return nestedTarget;
      }
    }
  }

  const cache = node.__lineToolCache;
  if (!cache || !shouldApplyLineToolToNode(node)) {
    return null;
  }

  const squareSize = Math.max(node.lineWidth * 3.2, node.radius * 0.05);

  for (const [fromGuid, squarePoint] of cache.endSquares.entries()) {
    if (Math.abs(worldX - squarePoint.x) <= squareSize / 2 && Math.abs(worldY - squarePoint.y) <= squareSize / 2) {
      const { guid: outputGuid, outputIndex } = parseOutputKey(fromGuid);
      const fromGlyph = getOutputSourceGlyphByGuid(node, outputGuid);
      if (fromGlyph) {
        return {
          node,
          fromGuid: outputGuid,
          fromOutputIndex: outputIndex,
          fromGlyph,
          fromPoint: cache.outputPoints.get(fromGuid)
            || fromGlyph.io?.output
            || getGlyphDefaultOutputPoint(node, fromGlyph, cache.circleOffset, outputIndex),
        };
      }
    }
  }

  for (const fromGuid of cache.outputSourceGuids) {
    const { guid: outputGuid, outputIndex } = parseOutputKey(fromGuid);
    const fromGlyph = getOutputSourceGlyphByGuid(node, outputGuid);
    if (!fromGlyph) {
      continue;
    }

    const outputPoints = getGlyphOutputPoints(node, fromGlyph, cache);
    for (const outputPoint of outputPoints) {
      if ((outputPoint.outputIndex ?? 0) !== outputIndex) {
        continue;
      }

      if (Math.hypot(worldX - outputPoint.x, worldY - outputPoint.y) <= cache.circleRadius * 1.25) {
        return {
          node,
          fromGuid: outputGuid,
          fromOutputIndex: outputIndex,
          fromGlyph,
          fromPoint: outputPoint,
        };
      }
    }
  }

  return null;
}

function findLineToolStartTarget(worldX, worldY) {
  if (wireDragState.active) {
    return null;
  }

  const canvasRoots = getCanvasRoots();
  for (let index = canvasRoots.length - 1; index >= 0; index -= 1) {
    const target = findLineToolStartTargetInNode(canvasRoots[index], worldX, worldY);
    if (target) {
      return target;
    }
  }

  return null;
}

function getExecGlyphByGuid(node, guid) {
  if (node.startGlyph.guid === guid) {
    return node.startGlyph;
  }

  return node.glyphs.find((glyph) => glyph.guid === guid) || null;
}

function getOutputSourceGlyphByGuid(node, guid) {
  return getExecGlyphByGuid(node, guid) || node.outerGlyphs.find((glyph) => glyph.guid === guid) || null;
}

function getGlyphDefaultOutputPoint(node, glyph, circleOffset, outputIndex = 0) {
  const angle = glyph.type === 'ifelse' && outputIndex === 1 ? (Math.PI / 2) + 0.48 : Math.PI / 2;
  const outwardEdge = getGlyphOuterRadius(glyph, Math.cos(angle), Math.sin(angle));
  return {
    x: glyph.x + Math.cos(angle) * (outwardEdge + circleOffset),
    y: glyph.y + Math.sin(angle) * (outwardEdge + circleOffset),
    kind: 'output',
    ownerGuid: glyph.guid,
    outputIndex,
  };
}

function getGlyphOutputPoints(node, glyph, cache) {
  if (isOwnedBooleanGlyph(glyph)) {
    return [];
  }

  if (glyph.type === 'goto') {
    return [];
  }

  if (glyph.io?.outputs?.length) {
    return glyph.io.outputs;
  }

  if (glyph.io?.output) {
    return [glyph.io.output];
  }

  const outputCount = glyph.type === 'ifelse' ? 2 : 1;
  return Array.from({ length: outputCount }, (_, outputIndex) => getGlyphDefaultOutputPoint(node, glyph, cache.circleOffset, outputIndex));
}

function getGlyphDefaultInputPoint(node, glyph, circleOffset) {
  const inwardEdge = getGlyphOuterRadius(glyph, 0, -1);
  return {
    x: glyph.x,
    y: glyph.y - (inwardEdge + circleOffset),
  };
}

function disconnectOutgoing(fromGlyph, outputIndex = 0) {
  if (fromGlyph.type === 'ifelse' && outputIndex === 1) {
    fromGlyph.nextGlyphGuidFalse = null;
    return;
  }

  fromGlyph.nextGlyphGuid = null;
  fromGlyph.nextGlyphGuidIsAuto = false;
}

function connectOutgoing(fromGlyph, toGuid, outputIndex = 0) {
  if (fromGlyph.type === 'ifelse' && outputIndex === 1) {
    fromGlyph.nextGlyphGuidFalse = toGuid;
    return;
  }

  fromGlyph.nextGlyphGuid = toGuid;
  fromGlyph.nextGlyphGuidIsAuto = false;
}

function startWireDrag(node, fromGuid, fromOutputIndex, fromPoint, pointerId, worldX, worldY) {
  wireDragState.active = true;
  wireDragState.pointerId = pointerId;
  wireDragState.node = node;
  wireDragState.fromGuid = fromGuid;
  wireDragState.fromOutputIndex = fromOutputIndex;
  wireDragState.fromPoint = fromPoint;
  wireDragState.toWorld = { x: worldX, y: worldY };
}

function clearWireDrag() {
  if (wireDragState.pointerId !== null && canvas.hasPointerCapture?.(wireDragState.pointerId)) {
    canvas.releasePointerCapture(wireDragState.pointerId);
  }

  wireDragState.active = false;
  wireDragState.pointerId = null;
  wireDragState.node = null;
  wireDragState.fromGuid = null;
  wireDragState.fromOutputIndex = 0;
  wireDragState.fromPoint = null;
  wireDragState.toWorld = null;
}

function finishWireDrag(clientX, clientY) {
  if (!wireDragState.active || !wireDragState.node || !wireDragState.fromGuid) {
    clearWireDrag();
    return;
  }

  const node = wireDragState.node;
  const fromGlyph = getOutputSourceGlyphByGuid(node, wireDragState.fromGuid);
  const cache = node.__lineToolCache;
  if (!fromGlyph || !cache) {
    clearWireDrag();
    return;
  }

  const circleRadius = cache.circleRadius;
  const circleOffset = cache.circleOffset;
  const rect = canvas.getBoundingClientRect();
  const dropPoint = screenToWorld(clientX - rect.left, clientY - rect.top);
  wireDragState.toWorld = { x: dropPoint.x, y: dropPoint.y };
  const isOuterDataSource = fromGlyph.ring === 'outer' && isOuterParamGlyphType(fromGlyph.type);

  let targetGuid = null;
  if (isOuterDataSource) {
    for (const [guid, paramPoint] of cache.paramInputPoints.entries()) {
      if (Math.hypot(dropPoint.x - paramPoint.x, dropPoint.y - paramPoint.y) <= circleRadius * 1.05) {
        targetGuid = guid;
        break;
      }
    }
  } else {
    for (const [guid, inputPoint] of cache.inputPoints.entries()) {
      if (guid === node.startGlyph.guid) {
        continue;
      }

      if (Math.hypot(dropPoint.x - inputPoint.x, dropPoint.y - inputPoint.y) <= circleRadius * 1.05) {
        targetGuid = guid;
        break;
      }
    }
  }

  if (targetGuid) {
    connectOutgoing(fromGlyph, targetGuid, wireDragState.fromOutputIndex);
  }

  layoutAllNodes();
  clearWireDrag();
  drawScene();

  updateCanvasHover(clientX, clientY);
}

function closeValueDropdown() {
  if (!activeValueDropdown) {
    activeValueGlyph = null;
    return;
  }

  activeValueDropdown.wrapper.remove();
  activeValueDropdown = null;
  activeValueGlyph = null;
}

function closeGotoDropdown() {
  if (!activeGotoDropdown) {
    activeGotoGlyph = null;
    return;
  }

  activeGotoDropdown.wrapper.remove();
  activeGotoDropdown = null;
  activeGotoGlyph = null;
}

function openBooleanModal(glyph) {
  activeBooleanGlyph = glyph;
  glyph.operation = normalizeBooleanOperation(glyph.operation);
  booleanModalOperatorSelect.value = glyph.operation;
  booleanModalCheckbox.checked = Boolean(glyph.checked);
  const isOuterGlyph = glyph.ring === 'outer';
  booleanModalOperatorField.hidden = isOuterGlyph;
  booleanModalCheckboxField.hidden = !isOuterGlyph;
  booleanModalBackdrop.classList.add('is-visible');
  booleanModalBackdrop.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    if (isOuterGlyph) {
      booleanModalCheckbox.focus();
    } else {
      booleanModalOperatorSelect.focus();
    }
  }, 0);
}

function closeBooleanModal(commit) {
  if (commit && activeBooleanGlyph) {
    if (activeBooleanGlyph.ring === 'outer') {
      activeBooleanGlyph.checked = Boolean(booleanModalCheckbox.checked);
    } else {
      activeBooleanGlyph.operation = normalizeBooleanOperation(booleanModalOperatorSelect.value);
    }
  }

  activeBooleanGlyph = null;
  booleanModalBackdrop.classList.remove('is-visible');
  booleanModalBackdrop.setAttribute('aria-hidden', 'true');
  drawScene();
}

function openIfElseModal(glyph) {
  activeIfElseGlyph = glyph;
  ifElseModalModeSelect.value = glyph.mode === 'or' ? 'or' : 'and';
  ifElseModalBackdrop.classList.add('is-visible');
  ifElseModalBackdrop.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    ifElseModalModeSelect.focus();
  }, 0);
}

function closeIfElseModal(commit) {
  if (commit && activeIfElseGlyph) {
    activeIfElseGlyph.mode = ifElseModalModeSelect.value === 'or' ? 'or' : 'and';
  }

  activeIfElseGlyph = null;
  ifElseModalBackdrop.classList.remove('is-visible');
  ifElseModalBackdrop.setAttribute('aria-hidden', 'true');
  drawScene();
}

function openValueDropdown(valueGlyph, clientX, clientY) {
  closeValueDropdown();

  activeValueGlyph = valueGlyph;
  const node = valueGlyph.parentNodeGuid ? findNodeByGuid(valueGlyph.parentNodeGuid) : null;
  if (!node) {
    return;
  }

  const hasParam = nodeHasParamInputConnection(node);
  const wrapper = document.createElement('div');
  wrapper.className = 'inline-dropdown';
  wrapper.style.left = `${Math.min(window.innerWidth - 180, clientX + 10)}px`;
  wrapper.style.top = `${Math.min(window.innerHeight - 44, clientY + 10)}px`;

  const select = document.createElement('select');
  select.className = 'inline-dropdown__select';

  const directOption = document.createElement('option');
  directOption.value = '1';
  directOption.textContent = '1 — Direct';
  select.append(directOption);

  if (hasParam) {
    const paramOption = document.createElement('option');
    paramOption.value = '2';
    paramOption.textContent = '2 — Param';
    select.append(paramOption);
  }

  ensureValueGlyphInputIsValid(valueGlyph);
  select.value = String(valueGlyph.inputIndex ?? 1);

  select.addEventListener('change', () => {
    valueGlyph.inputIndex = Number(select.value) === 2 ? 2 : 1;
    closeValueDropdown();
    drawScene();
  });

  select.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeValueDropdown();
      drawScene();
    }
  });

  select.addEventListener('blur', () => {
    closeValueDropdown();
    drawScene();
  });

  wrapper.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  wrapper.append(select);
  appShell.append(wrapper);

  activeValueDropdown = { wrapper, select };
  window.setTimeout(() => {
    select.focus();
  }, 0);
}

function openVariableModal(glyph) {
  activeVariableGlyph = glyph;
  variableModalNameInput.value = glyph.name || '';
  variableModalInput.value = glyph.value === 'null' ? '' : glyph.value;
  variableModalBackdrop.classList.add('is-visible');
  variableModalBackdrop.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    variableModalInput.focus();
    variableModalInput.select();
  }, 0);
}

function openLabelModal(glyph) {
  activeLabelGlyph = glyph;
  labelModalNameInput.value = glyph.name || '';
  labelModalBackdrop.classList.add('is-visible');
  labelModalBackdrop.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => {
    labelModalNameInput.focus();
    labelModalNameInput.select();
  }, 0);
}

function closeLabelModal(commit) {
  if (commit && activeLabelGlyph) {
    activeLabelGlyph.name = labelModalNameInput.value.trim() || (activeLabelGlyph.type === 'start' ? createNodeName() : createLabelName());
  }

  activeLabelGlyph = null;
  labelModalBackdrop.classList.remove('is-visible');
  labelModalBackdrop.setAttribute('aria-hidden', 'true');
  drawScene();
}

function closeVariableModal(commit) {
  if (commit && activeVariableGlyph) {
    activeVariableGlyph.name = variableModalNameInput.value.trim() || createVariableName();
    const nextValue = variableModalInput.value.trim() === '' ? 'null' : variableModalInput.value;
    activeVariableGlyph.value = nextValue;
  }

  activeVariableGlyph = null;
  variableModalBackdrop.classList.remove('is-visible');
  variableModalBackdrop.setAttribute('aria-hidden', 'true');
  drawScene();
}

function getAllVariableGlyphs(nodes = topLevelNodes, results = []) {
  nodes.forEach((node) => {
    node.outerGlyphs.forEach((glyph) => {
      if (glyph.type === 'variable') {
        results.push(glyph);
      }
    });

    node.glyphs.forEach((glyph) => {
      if (glyph.type === 'variable') {
        results.push(glyph);
      }

      if (isNode(glyph)) {
        getAllVariableGlyphs([glyph], results);
      }
    });
  });

  return results;
}

function getAllLabelGlyphs(nodes = topLevelNodes, results = []) {
  nodes.forEach((node) => {
    if (node.startGlyph) {
      results.push(node.startGlyph);
    }
    node.glyphs.forEach((glyph) => {
      if (glyph.type === 'label') {
        results.push(glyph);
      }

      if (isNode(glyph)) {
        getAllLabelGlyphs([glyph], results);
      }
    });
  });

  return results;
}

function getAllReferenceableGlyphs(nodes = topLevelNodes, results = []) {
  nodes.forEach((node) => {
    node.outerGlyphs.forEach((glyph) => {
      if (glyph.type === 'variable' || glyph.type === 'boolean') {
        results.push(glyph);
      }
    });

    node.glyphs.forEach((glyph) => {
      if (glyph.type === 'variable' || (glyph.type === 'boolean' && !isOwnedBooleanGlyph(glyph))) {
        results.push(glyph);
      }

      if (isNode(glyph)) {
        getAllReferenceableGlyphs([glyph], results);
      }
    });
  });

  return results;
}

function openReferenceModal(glyph) {
  activeReferenceGlyph = glyph;
  const variables = getAllReferenceableGlyphs().filter((variableGlyph) => variableGlyph.guid !== glyph.guid);
  referenceModalSelect.innerHTML = '<option value="">None</option>';

  variables.forEach((variableGlyph) => {
    const option = document.createElement('option');
    option.value = variableGlyph.guid;
    option.textContent = getReferenceableGlyphLabel(variableGlyph);
    referenceModalSelect.append(option);
  });

  referenceModalSelect.value = glyph.referenceGlyphGuid || '';
  referenceModalBackdrop.classList.add('is-visible');
  referenceModalBackdrop.setAttribute('aria-hidden', 'false');
}

function openGotoDropdown(glyph, clientX, clientY) {
  closeGotoDropdown();

  activeGotoGlyph = glyph;
  const labels = getAllLabelGlyphs();
  const wrapper = document.createElement('div');
  wrapper.className = 'inline-dropdown';
  wrapper.style.left = `${Math.min(window.innerWidth - 220, clientX + 10)}px`;
  wrapper.style.top = `${Math.min(window.innerHeight - 44, clientY + 10)}px`;

  const select = document.createElement('select');
  select.className = 'inline-dropdown__select';

  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = labels.length > 0 ? 'None' : 'No labels available';
  select.append(noneOption);

  labels.forEach((labelGlyph) => {
    const option = document.createElement('option');
    option.value = labelGlyph.guid;
    option.textContent = getJumpTargetLabel(labelGlyph);
    select.append(option);
  });

  select.value = glyph.targetLabelGuid || '';

  select.addEventListener('change', () => {
    glyph.targetLabelGuid = select.value || null;
    closeGotoDropdown();
    drawScene();
  });

  select.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeGotoDropdown();
      drawScene();
    }
  });

  select.addEventListener('blur', () => {
    closeGotoDropdown();
    drawScene();
  });

  wrapper.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
  });

  wrapper.append(select);
  appShell.append(wrapper);

  activeGotoDropdown = { wrapper, select };
  window.setTimeout(() => {
    select.focus();
  }, 0);
}

function closeReferenceModal(commit) {
  if (commit && activeReferenceGlyph) {
    activeReferenceGlyph.referenceGlyphGuid = referenceModalSelect.value || null;
  }

  activeReferenceGlyph = null;
  referenceModalBackdrop.classList.remove('is-visible');
  referenceModalBackdrop.setAttribute('aria-hidden', 'true');
  drawScene();
}

function openDeleteModal(glyph, sourceNode) {
  pendingDelete = { glyph, sourceNode };
  deleteModalBackdrop.classList.add('is-visible');
  deleteModalBackdrop.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal(commit) {
  if (commit && pendingDelete) {
    removeGlyphFromNode(pendingDelete.sourceNode, pendingDelete.glyph.guid);
    layoutAllNodes();
    drawScene();
  }

  pendingDelete = null;
  deleteModalBackdrop.classList.remove('is-visible');
  deleteModalBackdrop.setAttribute('aria-hidden', 'true');
}

function coerceNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function evaluateBooleanOperation(operation, inputValue, paramValue) {
  const leftValue = coerceNumber(inputValue);
  const rightValue = coerceNumber(paramValue);

  switch (normalizeBooleanOperation(operation)) {
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

function evaluateOwnedBooleanGlyph(node, glyph, currentValue, directInput, paramInput, ownerGlyph = null) {
  const paramOwnerGuid = ownerGlyph?.guid ?? glyph.guid;
  const paramSource = findIncomingOuterConnection(node, paramOwnerGuid);
  const comparisonValue = paramSource ? evaluateOuterGlyphValue(paramSource, directInput, paramInput, __runtimeContext) : 0;
  glyph.lastResult = evaluateBooleanOperation(glyph.operation, currentValue, comparisonValue) ? 1 : 0;
  return glyph.lastResult;
}

function evaluateIfElseCondition(node, glyph, currentValue, directInput, paramInput) {
  const ownedBooleans = getOwnedBooleans(glyph, node);
  if (ownedBooleans.length === 0) {
    return true;
  }

  const results = ownedBooleans.map((ownedBoolean) => evaluateOwnedBooleanGlyph(node, ownedBoolean, currentValue, directInput, paramInput, glyph) === 1);
  return glyph.mode === 'or' ? results.some(Boolean) : results.every(Boolean);
}

function findNodeByGuid(targetGuid, nodes = topLevelNodes) {
  for (const node of nodes) {
    if (node.guid === targetGuid) {
      return node;
    }

    const nestedNodes = node.glyphs.filter(isNode);
    const nestedMatch = findNodeByGuid(targetGuid, nestedNodes);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function findGlyphByGuid(targetGuid, nodes = topLevelNodes) {
  for (const node of nodes) {
    if (node.startGlyph.guid === targetGuid) {
      return node.startGlyph;
    }

    for (const glyph of [...node.outerGlyphs, ...node.glyphs]) {
      if (glyph.guid === targetGuid) {
        return glyph;
      }

      if (isNode(glyph)) {
        const nestedGlyph = findGlyphByGuid(targetGuid, [glyph]);
        if (nestedGlyph) {
          return nestedGlyph;
        }
      }
    }
  }

  return null;
}

function getParentNode(node) {
  return node.parentNodeGuid ? findNodeByGuid(node.parentNodeGuid) : null;
}

function nodeHasParamInputConnection(node) {
  const parentNode = getParentNode(node);
  if (!parentNode) {
    return false;
  }

  return parentNode.outerGlyphs.some((glyph) => glyph.nextGlyphGuid === node.guid);
}

function ensureValueGlyphInputIsValid(valueGlyph) {
  const parentNode = valueGlyph.parentNodeGuid ? findNodeByGuid(valueGlyph.parentNodeGuid) : null;
  if (!parentNode) {
    valueGlyph.inputIndex = 1;
    return;
  }

  const hasParam = nodeHasParamInputConnection(parentNode);
  if (!hasParam && valueGlyph.inputIndex === 2) {
    valueGlyph.inputIndex = 1;
  }

  if (valueGlyph.inputIndex !== 2) {
    valueGlyph.inputIndex = 1;
  }
}

function buildNodeExecutionLookup(node) {
  const map = new Map();
  getExecutableSequence(node).forEach((glyph) => {
    map.set(glyph.guid, glyph);
  });
  return map;
}

function executeGlyph(node, glyph, currentValue, directInput, paramInput) {
  switch (glyph.type) {
    case 'variable':
      if (glyph.ring === 'outer') {
        return getRuntimeVar(glyph);
      }
      setRuntimeVar(glyph, currentValue);
      return currentValue;
    case 'value':
      return currentValue;
    case 'label':
      return currentValue;
    case 'goto': {
      const target = getGotoTarget(glyph);
      return target
        ? { kind: 'goto', targetLabelGuid: target.guid, value: currentValue }
        : currentValue;
    }
    case 'reference': {
      const target = getReferenceTarget(glyph);
      if (glyph.ring === 'outer') {
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
    case 'add': {
      const paramSource = findIncomingOuterConnection(node, glyph.guid);
      const operandValue = paramSource ? evaluateOuterGlyphValue(paramSource, directInput, paramInput, __runtimeContext) : 1;
      return coerceNumber(currentValue) + coerceNumber(operandValue);
    }
    case 'subtract': {
      const paramSource = findIncomingOuterConnection(node, glyph.guid);
      const operandValue = paramSource ? evaluateOuterGlyphValue(paramSource, directInput, paramInput, __runtimeContext) : 1;
      return coerceNumber(currentValue) - coerceNumber(operandValue);
    }
    case 'setvalue': {
      const paramSource = findIncomingOuterConnection(node, glyph.guid);
      const nextValue = paramSource ? evaluateOuterGlyphValue(paramSource, directInput, paramInput, __runtimeContext) : currentValue;

      // Find the incoming execution glyph (the one that connects to this glyph's input).
      let prevExec = null;
      if (node.startGlyph?.nextGlyphGuid === glyph.guid) {
        prevExec = node.startGlyph;
      } else {
        prevExec = node.glyphs.find((g) => g.nextGlyphGuid === glyph.guid || (g.type === 'ifelse' && (g.nextGlyphGuid === glyph.guid || g.nextGlyphGuidFalse === glyph.guid))) || null;
      }

      // If the previous exec glyph is a Variable, set it; if it's a Reference, set its target variable.
      if (prevExec?.type === 'variable') {
        setRuntimeVar(prevExec, nextValue);
      } else if (prevExec?.type === 'reference') {
        const target = getReferenceTarget(prevExec);
        if (target && target.type === 'variable') {
          setRuntimeVar(target, nextValue);
        }
      }

      return nextValue;
    }
    case 'boolean': {
      return evaluateOwnedBooleanGlyph(node, glyph, currentValue, directInput, paramInput);
    }
    case 'output':
      console.log(currentValue);
      appendMessageLog(currentValue);
      return currentValue;
    case 'ifelse':
      glyph.lastResult = evaluateIfElseCondition(node, glyph, currentValue, directInput, paramInput) ? 1 : 0;
      return currentValue;
    default:
      return currentValue;
  }
}

function isExecutionJump(value) {
  return Boolean(value)
    && typeof value === 'object'
    && value.kind === 'goto'
    && typeof value.targetLabelGuid === 'string';
}

function findIncomingOuterConnection(node, targetGuid) {
  return node.outerGlyphs.find((glyph) => glyph.nextGlyphGuid === targetGuid) || null;
}

// Runtime context to avoid mutating glyph values during execution
let __runtimeContext = null;

function createRuntimeContext() {
  const vars = new Map();
  getAllVariableGlyphs().forEach((v) => {
    vars.set(v.guid, v.value);
  });
  return { vars };
}

function getRuntimeVar(glyph) {
  if (!__runtimeContext?.vars) {
    return glyph.value;
  }
  return __runtimeContext.vars.has(glyph.guid) ? __runtimeContext.vars.get(glyph.guid) : glyph.value;
}

function setRuntimeVar(glyph, nextValue) {
  if (!__runtimeContext) {
    __runtimeContext = createRuntimeContext();
  }
  const normalized = nextValue === null || nextValue === undefined ? 'null' : String(nextValue);
  __runtimeContext.vars.set(glyph.guid, normalized);
}

function evaluateOuterGlyphValue(glyph, directInput, paramInput, runtimeCtx = __runtimeContext) {
  if (!glyph) {
    return directInput;
  }

  if (glyph.type === 'value') {
    ensureValueGlyphInputIsValid(glyph);
    return glyph.inputIndex === 2 ? paramInput : directInput;
  }

  if (glyph.type === 'variable') {
    return runtimeCtx?.vars?.has(glyph.guid) ? runtimeCtx.vars.get(glyph.guid) : glyph.value;
  }

  if (glyph.type === 'reference') {
    const target = getReferenceTarget(glyph);
    if (target?.type === 'boolean') {
      return target.ring === 'outer'
        ? (target.checked ? 1 : 0)
        : (target.lastResult ?? 0);
    }

    if (!target) {
      return directInput;
    }
    return target.type === 'variable'
      ? (runtimeCtx?.vars?.has(target.guid) ? runtimeCtx.vars.get(target.guid) : target.value)
      : directInput;
  }

  if (glyph.type === 'boolean') {
    return glyph.checked ? 1 : 0;
  }

  return directInput;
}

function resolveParamInputForChild(parentNode, childNodeGuid, directInput, paramInput) {
  const paramSource = findIncomingOuterConnection(parentNode, childNodeGuid);
  if (!paramSource) {
    return null;
  }

  return evaluateOuterGlyphValue(paramSource, directInput, paramInput, __runtimeContext);
}

function executeNodeFrom(node, startGuid, currentValue, directInput, paramInput = null) {
  const lookup = buildNodeExecutionLookup(node);
  let currentGuid = startGuid;

  while (currentGuid) {
    const glyph = lookup.get(currentGuid) ?? findNodeByGuid(currentGuid, [node]);
    if (!glyph) {
      break;
    }

    if (isNode(glyph)) {
      const childParamValue = resolveParamInputForChild(node, glyph.guid, directInput, paramInput);
      const childResult = executeNode(glyph, currentValue, childParamValue);
      if (isExecutionJump(childResult)) {
        return childResult;
      }
      currentValue = childResult;
    } else {
      const glyphResult = executeGlyph(node, glyph, currentValue, directInput, paramInput);
      if (isExecutionJump(glyphResult)) {
        return glyphResult;
      }
      currentValue = glyphResult;
    }

    if (glyph.type === 'ifelse') {
      currentGuid = glyph.lastResult === 1
        ? glyph.nextGlyphGuid
        : glyph.nextGlyphGuidFalse;
    } else {
      currentGuid = glyph.nextGlyphGuid;
    }
  }

  return currentValue;
}

function executeNode(node, incomingValue, paramValue = null) {
  const directInput = incomingValue;
  const paramInput = paramValue;
  const startInputSource = findIncomingOuterConnection(node, node.startGlyph.guid);
  let currentValue = startInputSource
    ? evaluateOuterGlyphValue(startInputSource, directInput, paramInput, __runtimeContext)
    : directInput;

  return executeNodeFrom(node, node.startGlyph.nextGlyphGuid, currentValue, directInput, paramInput);
}

function getStepParamName(node, glyph) {
  const paramSource = findIncomingOuterConnection(node, glyph.guid);
  if (!paramSource) {
    return '';
  }

  if (paramSource.type === 'variable') {
    return paramSource.name || '';
  }

  if (paramSource.type === 'reference') {
    const target = getReferenceTarget(paramSource);
    return target?.type === 'variable' ? (target.name || '') : '';
  }

  return paramSource.name || paramSource.type;
}

function getStepGlyphName(node, glyph) {
  if (!glyph) {
    return '';
  }

  if (isNode(glyph)) {
    return glyph.startGlyph?.name || 'node';
  }

  if (glyph.type === 'goto') {
    const target = getGotoTarget(glyph);
    return getJumpTargetLabel(target);
  }

  if (glyph.type === 'reference') {
    const target = getReferenceTarget(glyph);
    return target?.type === 'variable' ? (target.name || '') : '';
  }

  if (glyph.type === 'add' || glyph.type === 'setvalue' || glyph.type === 'ifelse') {
    return getStepParamName(node, glyph);
  }

  return glyph.name || glyph.type;
}

function logStepGlyph(node, glyph, inValue) {
  const glyphName = getStepGlyphName(node, glyph);
  const message = `STEP: ${inValue} | guid=${glyph.guid} | type=${glyph.type} | name=${glyphName}`;

  try {
    window.SpellcircleConsole?.log?.(message);
  } catch (_) {
    // best-effort only
  }
}

function createStepFrameFromNodeStart(node, incomingValue, paramValue = null) {
  const directInput = incomingValue;
  const paramInput = paramValue;
  const startInputSource = findIncomingOuterConnection(node, node.startGlyph.guid);
  const currentValue = startInputSource
    ? evaluateOuterGlyphValue(startInputSource, directInput, paramInput, __runtimeContext)
    : directInput;

  return {
    nodeGuid: node.guid,
    currentGuid: node.startGlyph.nextGlyphGuid,
    currentValue,
    directInput,
    paramInput,
    waitingForChild: false,
    nextAfterChild: null,
  };
}

function createStepFrameFromGuid(node, startGuid, incomingValue, directInput = incomingValue, paramInput = null) {
  return {
    nodeGuid: node.guid,
    currentGuid: startGuid,
    currentValue: incomingValue,
    directInput,
    paramInput,
    waitingForChild: false,
    nextAfterChild: null,
  };
}

function collapseCompletedStepFrames() {
  if (!stepExecutionState) {
    return;
  }

  while (stepExecutionState.stack.length > 0) {
    const frame = stepExecutionState.stack[stepExecutionState.stack.length - 1];
    if (frame.currentGuid) {
      return;
    }

    const finishedValue = frame.currentValue;
    stepExecutionState.stack.pop();

    if (stepExecutionState.stack.length === 0) {
      stepExecutionState.completed = true;
      stepExecutionState.result = finishedValue;
      return;
    }

    const parentFrame = stepExecutionState.stack[stepExecutionState.stack.length - 1];
    if (parentFrame.waitingForChild) {
      parentFrame.currentValue = finishedValue;
      parentFrame.currentGuid = parentFrame.nextAfterChild;
      parentFrame.waitingForChild = false;
      parentFrame.nextAfterChild = null;
    }
  }
}

function setStepStateToJumpTarget(jumpResult) {
  const targetLabel = findGlyphByGuid(jumpResult.targetLabelGuid);
  if (!targetLabel) {
    appendMessageLog(`Goto target missing: ${jumpResult.targetLabelGuid}`);
    stepExecutionState.stack = [];
    stepExecutionState.completed = true;
    stepExecutionState.result = jumpResult.value;
    return;
  }

  if (targetLabel.type === 'label') {
    const targetNode = targetLabel.parentNodeGuid ? findNodeByGuid(targetLabel.parentNodeGuid) : null;
    if (!targetNode) {
      appendMessageLog(`Goto label target has no node: ${jumpResult.targetLabelGuid}`);
      stepExecutionState.stack = [];
      stepExecutionState.completed = true;
      stepExecutionState.result = jumpResult.value;
      return;
    }

    stepExecutionState.stack = [createStepFrameFromGuid(targetNode, targetLabel.guid, jumpResult.value, jumpResult.value, null)];
    stepExecutionState.completed = false;
    stepExecutionState.result = null;
    return;
  }

  if (targetLabel.type === 'start') {
    const targetNode = targetLabel.parentNodeGuid ? findNodeByGuid(targetLabel.parentNodeGuid) : null;
    if (!targetNode) {
      appendMessageLog(`Goto start target has no node: ${jumpResult.targetLabelGuid}`);
      stepExecutionState.stack = [];
      stepExecutionState.completed = true;
      stepExecutionState.result = jumpResult.value;
      return;
    }

    stepExecutionState.stack = [createStepFrameFromGuid(targetNode, targetLabel.guid, jumpResult.value, jumpResult.value, null)];
    stepExecutionState.completed = false;
    stepExecutionState.result = null;
    return;
  }

  appendMessageLog(`Unsupported goto target type: ${targetLabel.type}`);
  stepExecutionState.stack = [];
  stepExecutionState.completed = true;
  stepExecutionState.result = jumpResult.value;
}

function initializeStepExecution() {
  const entryNode = getEntryNode();
  if (!entryNode) {
    return false;
  }

  layoutAllNodes();
  updateNodeOrdering(entryNode);
  __runtimeContext = createRuntimeContext();

  stepExecutionState = {
    stack: [createStepFrameFromNodeStart(entryNode, null)],
    completed: false,
    result: null,
  };

  collapseCompletedStepFrames();
  return true;
}

function runSingleProgramStep() {
  if (!stepExecutionState || stepExecutionState.completed) {
    const initialized = initializeStepExecution();
    if (!initialized) {
      return true;
    }
  }

  collapseCompletedStepFrames();
  if (stepExecutionState.completed) {
    return true;
  }

  while (stepExecutionState.stack.length > 0) {
    const frame = stepExecutionState.stack[stepExecutionState.stack.length - 1];
    const node = findNodeByGuid(frame.nodeGuid);
    if (!node) {
      stepExecutionState.stack.pop();
      collapseCompletedStepFrames();
      return stepExecutionState.completed;
    }

    const lookup = buildNodeExecutionLookup(node);
    const glyph = lookup.get(frame.currentGuid) ?? findNodeByGuid(frame.currentGuid, [node]);
    if (!glyph) {
      frame.currentGuid = null;
      collapseCompletedStepFrames();
      if (stepExecutionState.completed) {
        return true;
      }
      continue;
    }

    if (isNode(glyph)) {
      const childParamValue = resolveParamInputForChild(node, glyph.guid, frame.directInput, frame.paramInput);
      frame.waitingForChild = true;
      frame.nextAfterChild = glyph.nextGlyphGuid;
      stepExecutionState.stack.push(createStepFrameFromNodeStart(glyph, frame.currentValue, childParamValue));
      collapseCompletedStepFrames();
      if (stepExecutionState.completed) {
        return true;
      }
      continue;
    }

    logStepGlyph(node, glyph, frame.currentValue);
    const glyphResult = executeGlyph(node, glyph, frame.currentValue, frame.directInput, frame.paramInput);
    if (isExecutionJump(glyphResult)) {
      setStepStateToJumpTarget(glyphResult);
      return stepExecutionState.completed;
    }

    frame.currentValue = glyphResult;
    frame.currentGuid = glyph.type === 'ifelse'
      ? (glyph.lastResult === 1 ? glyph.nextGlyphGuid : glyph.nextGlyphGuidFalse)
      : glyph.nextGlyphGuid;

    collapseCompletedStepFrames();
    return stepExecutionState.completed;
  }

  stepExecutionState.completed = true;
  return true;
}

function executeFromLabel(labelGlyph, incomingValue) {
  const targetNode = labelGlyph?.parentNodeGuid ? findNodeByGuid(labelGlyph.parentNodeGuid) : null;
  if (!targetNode) {
    return incomingValue;
  }

  return executeNodeFrom(targetNode, labelGlyph.guid, incomingValue, incomingValue, null);
}

function setProgramButtonsBusy(busy) {
  if (playProgramButton) {
    playProgramButton.disabled = busy;
  }

  if (stepProgramButton) {
    stepProgramButton.disabled = busy;
  }
}

function runProgram(stepMode = false) {
  if (isProgramRunning) {
    return;
  }

  isProgramRunning = true;
  setProgramButtonsBusy(true);

  try {
    if (stepMode) {
      const finished = runSingleProgramStep();
      if (finished) {
        console.log('MagiScript execution finished:', stepExecutionState?.result);
      }
      return;
    }

    stepExecutionState = null;
    const entryNode = getEntryNode();
    if (!entryNode) {
      return;
    }

    layoutAllNodes();
    updateNodeOrdering(entryNode);
    __runtimeContext = createRuntimeContext();
    let result = executeNode(entryNode, null);

    while (isExecutionJump(result)) {
      const targetLabel = findGlyphByGuid(result.targetLabelGuid);
      if (!targetLabel) {
        appendMessageLog(`Goto target missing: ${result.targetLabelGuid}`);
        result = result.value;
        break;
      }

      if (targetLabel.type === 'label') {
        result = executeFromLabel(targetLabel, result.value);
      } else if (targetLabel.type === 'start') {
        const targetNode = targetLabel.parentNodeGuid ? findNodeByGuid(targetLabel.parentNodeGuid) : null;
        if (!targetNode) {
          appendMessageLog(`Goto start target has no node: ${result.targetLabelGuid}`);
          result = result.value;
          break;
        }
        result = executeNodeFrom(targetNode, targetLabel.guid, result.value, result.value, null);
      } else {
        appendMessageLog(`Unsupported goto target type: ${targetLabel.type}`);
        result = result.value;
        break;
      }
    }

    console.log('MagiScript execution finished:', result);
  } finally {
    setProgramButtonsBusy(false);
    isProgramRunning = false;
  }
}

function getNodeStartY(node) {
  return node.layout ? node.startGlyph.y : node.y;
}

function getEntryNode() {
  if (topLevelNodes.length === 0) {
    return null;
  }

  if (topLevelNodes.length === 1) {
    return topLevelNodes[0];
  }

  return [...topLevelNodes].sort((left, right) => getNodeStartY(left) - getNodeStartY(right))[0];
}

function serializeNode(node, nodes, glyphs) {
  updateNodeOrdering(node);
  nodes[node.guid] = {
    guid: node.guid,
    type: 'node',
    parentNodeGuid: node.parentNodeGuid,
    nextGlyphGuid: node.nextGlyphGuid,
    x: node.x,
    y: node.y,
    radius: node.radius,
    isRoot: Boolean(node.isRoot),
    glyphGuids: [node.startGlyph.guid, ...node.glyphs.map((glyph) => glyph.guid)],
    outerGlyphGuids: node.outerGlyphs.map((glyph) => glyph.guid),
  };

  glyphs[node.startGlyph.guid] = {
    guid: node.startGlyph.guid,
    type: 'start',
    parentNodeGuid: node.guid,
    nextGlyphGuid: node.startGlyph.nextGlyphGuid,
    ...(node.startGlyph.name !== undefined ? { name: node.startGlyph.name } : {}),
  };

  node.glyphs.forEach((glyph) => {
    if (isNode(glyph)) {
      serializeNode(glyph, nodes, glyphs);
      return;
    }

    glyphs[glyph.guid] = {
      guid: glyph.guid,
      type: glyph.type,
      parentNodeGuid: glyph.parentNodeGuid,
      nextGlyphGuid: glyph.nextGlyphGuid,
      ...(glyph.nextGlyphGuidFalse !== undefined ? { nextGlyphGuidFalse: glyph.nextGlyphGuidFalse } : {}),
      ...(glyph.ring ? { ring: glyph.ring } : {}),
      ...(glyph.name !== undefined ? { name: glyph.name } : {}),
      ...(glyph.value !== undefined ? { value: glyph.value } : {}),
      ...(glyph.inputIndex !== undefined ? { inputIndex: glyph.inputIndex } : {}),
      ...(glyph.operand !== undefined ? { operand: glyph.operand } : {}),
      ...(glyph.targetLabelGuid !== undefined ? { targetLabelGuid: glyph.targetLabelGuid } : {}),
      ...(glyph.referenceGlyphGuid !== undefined ? { referenceGlyphGuid: glyph.referenceGlyphGuid } : {}),
      ...(glyph.ownerIfGlyphGuid !== undefined ? { ownerIfGlyphGuid: glyph.ownerIfGlyphGuid } : {}),
      ...(glyph.operation !== undefined ? { operation: glyph.operation } : {}),
      ...(glyph.checked !== undefined ? { checked: glyph.checked } : {}),
      ...(glyph.mode !== undefined ? { mode: glyph.mode } : {}),
    };
  });

  node.outerGlyphs.forEach((glyph) => {
    glyphs[glyph.guid] = {
      guid: glyph.guid,
      type: glyph.type,
      parentNodeGuid: glyph.parentNodeGuid,
      nextGlyphGuid: glyph.nextGlyphGuid,
      ...(glyph.nextGlyphGuidFalse !== undefined ? { nextGlyphGuidFalse: glyph.nextGlyphGuidFalse } : {}),
      ...(glyph.ring ? { ring: glyph.ring } : {}),
      ...(glyph.name !== undefined ? { name: glyph.name } : {}),
      ...(glyph.value !== undefined ? { value: glyph.value } : {}),
      ...(glyph.inputIndex !== undefined ? { inputIndex: glyph.inputIndex } : {}),
      ...(glyph.targetLabelGuid !== undefined ? { targetLabelGuid: glyph.targetLabelGuid } : {}),
      ...(glyph.referenceGlyphGuid !== undefined ? { referenceGlyphGuid: glyph.referenceGlyphGuid } : {}),
      ...(glyph.ownerIfGlyphGuid !== undefined ? { ownerIfGlyphGuid: glyph.ownerIfGlyphGuid } : {}),
      ...(glyph.operation !== undefined ? { operation: glyph.operation } : {}),
      ...(glyph.checked !== undefined ? { checked: glyph.checked } : {}),
      ...(glyph.mode !== undefined ? { mode: glyph.mode } : {}),
    };
  });
}

function serializeProgram() {
  debugSpellcircle('serialize:start', {
    topLevelNodeCount: topLevelNodes.length,
  });
  layoutAllNodes();
  const nodes = {};
  const glyphs = {};
  topLevelNodes.forEach((node) => serializeNode(node, nodes, glyphs));

  const program = {
    version: 1,
    rootNodeGuids: topLevelNodes.map((node) => node.guid),
    nodes,
    glyphs,
  };

  debugSpellcircle('serialize:complete', {
    rootCount: program.rootNodeGuids.length,
    nodeCount: Object.keys(nodes).length,
    glyphCount: Object.keys(glyphs).length,
  });

  return program;
}

function resetProgramState() {
  closeValueDropdown();
  closeGotoDropdown();
  hideTooltip();

  topLevelNodes.length = 0;
  focusedNode = null;
  pendingDelete = null;
  stepExecutionState = null;
}

function hydrateGlyphFromSerialized(serialized) {
  let glyph = null;
  const base = {
    guid: serialized.guid,
    parentNodeGuid: serialized.parentNodeGuid,
  };

  switch (serialized.type) {
    case 'start':
      glyph = new StartGlyph({ ...base, name: serialized.name ?? 'start' });
      break;
    case 'variable':
      glyph = new VariableGlyph({
        ...base,
        name: serialized.name ?? createVariableName(),
        value: serialized.value ?? 'null',
      });
      break;
    case 'value':
      glyph = new ValueGlyph({
        ...base,
        name: serialized.name ?? 'Value',
        inputIndex: serialized.inputIndex ?? 1,
      });
      break;
    case 'label':
      glyph = new LabelGlyph({
        ...base,
        name: serialized.name ?? createLabelName(),
      });
      break;
    case 'goto':
      glyph = new GotoGlyph({
        ...base,
        targetLabelGuid: serialized.targetLabelGuid ?? null,
      });
      break;
    case 'reference':
      glyph = new ReferenceGlyph({
        ...base,
        referenceGlyphGuid: serialized.referenceGlyphGuid ?? null,
      });
      break;
    case 'add':
      glyph = new AddGlyph({
        ...base,
        operand: serialized.operand ?? '1',
      });
      break;
    case 'subtract':
      glyph = new SubtractGlyph({
        ...base,
        operand: serialized.operand ?? '1',
      });
      break;
    case 'setvalue':
      glyph = new SetValueGlyph({
        ...base,
      });
      break;
    case 'output':
      glyph = new OutputGlyph(base);
      break;
    case 'boolean':
      glyph = new BooleanGlyph({
        ...base,
        operation: serialized.operation ?? 'equal',
        checked: serialized.checked ?? false,
        ownerIfGlyphGuid: serialized.ownerIfGlyphGuid ?? null,
      });
      break;
    case 'ifelse':
      glyph = new IfElseGlyph({
        ...base,
        mode: serialized.mode ?? 'and',
        nextGlyphGuidFalse: serialized.nextGlyphGuidFalse ?? null,
      });
      break;
    default:
      glyph = new Glyph({ guid: serialized.guid, type: serialized.type, parentNodeGuid: serialized.parentNodeGuid });
      break;
  }

  glyph.nextGlyphGuid = serialized.nextGlyphGuid ?? null;
  if (glyph.type === 'ifelse') {
    glyph.nextGlyphGuidFalse = serialized.nextGlyphGuidFalse ?? null;
  }
  glyph.nextGlyphGuidIsAuto = false;
  glyph.x = 0;
  glyph.y = 0;
  glyph.radius = CHILD_BASE_RADIUS;
  glyph.lineWidth = BASE_NODE_LINE_WIDTH;
  glyph.ring = serialized.ring || 'inner';

  return glyph;
}

function deserializeProgram(program) {
  debugSpellcircle('deserialize:start', {
    hasProgram: Boolean(program),
    rootCount: Array.isArray(program?.rootNodeGuids) ? program.rootNodeGuids.length : null,
  });

  if (!program || typeof program !== 'object') {
    debugSpellcircle('deserialize:invalid-program');
    return false;
  }

  if (!Array.isArray(program.rootNodeGuids) || !program.nodes || !program.glyphs) {
    debugSpellcircle('deserialize:invalid-shape', {
      hasRoots: Array.isArray(program.rootNodeGuids),
      hasNodes: Boolean(program.nodes),
      hasGlyphs: Boolean(program.glyphs),
    });
    return false;
  }

  const nodeByGuid = new Map();
  const nodes = program.nodes;
  const glyphs = program.glyphs;

  Object.values(nodes).forEach((serializedNode) => {
    if (!serializedNode || serializedNode.type !== 'node' || !serializedNode.guid) {
      return;
    }

    const radius = Number(serializedNode.radius) || ROOT_NODE_RADIUS;
    const node = new NodeGlyph({
      guid: serializedNode.guid,
      parentNodeGuid: serializedNode.parentNodeGuid ?? null,
      isRoot: Boolean(serializedNode.isRoot),
    });
    node.nextGlyphGuid = serializedNode.nextGlyphGuid ?? null;
    node.x = Number(serializedNode.x) || 0;
    node.y = Number(serializedNode.y) || 0;
    node.radius = radius;
    node.lineWidth = getStrokeWidthForRadius(radius);

    nodeByGuid.set(node.guid, node);
  });

  debugSpellcircle('deserialize:nodes-hydrated', {
    nodeCount: nodeByGuid.size,
  });

  const hydratedGlyphByGuid = new Map();
  const getHydratedGlyph = (guid) => {
    if (!guid) {
      return null;
    }

    if (hydratedGlyphByGuid.has(guid)) {
      return hydratedGlyphByGuid.get(guid);
    }

    const serialized = glyphs[guid];
    if (!serialized) {
      return null;
    }

    const hydrated = hydrateGlyphFromSerialized(serialized);
    hydratedGlyphByGuid.set(guid, hydrated);
    return hydrated;
  };

  // Attach start glyphs, inner glyphs, and outer glyphs.
  Object.values(nodes).forEach((serializedNode) => {
    const node = nodeByGuid.get(serializedNode.guid);
    if (!node) {
      return;
    }

    const glyphGuids = Array.isArray(serializedNode.glyphGuids) ? serializedNode.glyphGuids : [];
    const outerGlyphGuids = Array.isArray(serializedNode.outerGlyphGuids) ? serializedNode.outerGlyphGuids : [];

    const startGuid = glyphGuids[0];
    const startGlyph = getHydratedGlyph(startGuid);
    if (startGlyph && startGlyph.type === 'start') {
      node.startGlyph = startGlyph;
      node.startGlyph.parentNodeGuid = node.guid;
    } else {
      // Fallback: create a start glyph if missing.
      node.startGlyph = createStartGlyph(node.guid);
      node.startGlyph.name = createNodeName();
      node.startGlyph.nextGlyphGuidIsAuto = false;
    }

    for (const guid of glyphGuids.slice(1)) {
      const nestedNode = nodeByGuid.get(guid);
      if (nestedNode) {
        node.glyphs.push(nestedNode);
        continue;
      }

      const glyph = getHydratedGlyph(guid);
      if (glyph) {
        node.glyphs.push(glyph);
      }
    }

    for (const guid of outerGlyphGuids) {
      const glyph = getHydratedGlyph(guid);
      if (glyph) {
        glyph.ring = 'outer';
        node.outerGlyphs.push(glyph);
      }
    }
  });

  const roots = program.rootNodeGuids
    .map((guid) => nodeByGuid.get(guid))
    .filter(Boolean);

  if (roots.length === 0) {
    debugSpellcircle('deserialize:no-roots');
    return false;
  }

  // Recompute variableCount so newly-created variables keep unique names.
  variableCount = 0;
  nodeCount = 0;
  for (const glyph of hydratedGlyphByGuid.values()) {
    if (glyph.type !== 'variable' || typeof glyph.name !== 'string') {
      continue;
    }

    const match = glyph.name.match(/^variable_(\d+)$/);
    if (match) {
      variableCount = Math.max(variableCount, Number(match[1]) || 0);
    }
  }

  // Recompute nodeCount so StartGlyph default names remain unique.
  for (const glyph of hydratedGlyphByGuid.values()) {
    if (glyph.type !== 'start' || typeof glyph.name !== 'string') {
      continue;
    }

    const match = glyph.name.match(/^node_(\d+)$/);
    if (match) {
      nodeCount = Math.max(nodeCount, Number(match[1]) || 0);
    }
  }

  resetProgramState();
  roots.forEach((node) => topLevelNodes.push(node));
  focusedNode = roots[0];

  layoutAllNodes();
  drawScene();
  debugSpellcircle('deserialize:complete', {
    rootCount: roots.length,
    focusedNodeGuid: focusedNode?.guid ?? null,
  });
  return true;
}

function playProgram() {
  void runProgram(false);
}

function stepProgram() {
  void runProgram(true);
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = dropZone.getBoundingClientRect();

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScene();
}

function createRootNodeAt(worldX, worldY) {
  const rootNode = createNode(worldX, worldY, ROOT_NODE_RADIUS, null, { isRoot: true });
  topLevelNodes.push(rootNode);
  focusedNode = rootNode;
  layoutAllNodes();
  appShell.classList.add('has-objects');
  drawScene();
  return rootNode;
}

function appendGlyphToNode(targetNode, glyphType) {
  const glyph = glyphType === 'node'
    ? createNode(targetNode.x, targetNode.y, getScaledValue(targetNode, CHILD_RADIUS_RATIO), targetNode.guid)
    : createGlyph(glyphType, targetNode.guid);

  if (glyphType === 'value') {
    glyph.ring = 'outer';
    targetNode.outerGlyphs.push(glyph);
  } else {
    targetNode.glyphs.push(glyph);
  }
  layoutAllNodes();
  drawScene();
  return glyph;
}

function spawnGlyphAtDrop(glyphType, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const worldPoint = screenToWorld(clientX - rect.left, clientY - rect.top);

  if (topLevelNodes.length === 0 && glyphType === 'node') {
    createRootNodeAt(worldPoint.x, worldPoint.y);
    return;
  }

  if (topLevelNodes.length === 0) {
    const rootNode = createRootNodeAt(worldPoint.x, worldPoint.y);
    appendGlyphToNode(rootNode, glyphType);
    return;
  }

  const targetNode = findDropTarget(worldPoint.x, worldPoint.y) || getActiveCanvasRoot() || topLevelNodes[0];
  appendGlyphToNode(targetNode, glyphType);
}

function recenterCanvas() {
  focusedNode = getPrimaryRootNode();
  drawScene();
}

function focusParentNode() {
  const parentNode = focusedNode?.parentNodeGuid ? findNodeByGuid(focusedNode.parentNodeGuid) : null;
  if (!parentNode) {
    return;
  }

  focusNode(parentNode);
}

function stopPanning(pointerId) {
  if (panState.pointerId !== pointerId) {
    return;
  }

  panState.active = false;
  panState.pointerId = null;
}

glyphCards.forEach((card) => {
  card.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('application/x-magi-object', card.dataset.objectType || 'node');
    event.dataTransfer.effectAllowed = 'copy';
  });

  card.addEventListener('mouseenter', (event) => {
    showTooltip(card.dataset.name || '', card.dataset.description || '', event.clientX, event.clientY);
  });

  card.addEventListener('mousemove', (event) => {
    moveTooltip(event.clientX, event.clientY);
  });

  card.addEventListener('mouseleave', () => {
    hideTooltip();
  });

  card.addEventListener('focus', () => {
    const rect = card.getBoundingClientRect();
    showTooltip(card.dataset.name || '', card.dataset.description || '', rect.right, rect.top);
  });

  card.addEventListener('blur', () => {
    hideTooltip();
  });
});

trayToggle.addEventListener('click', () => {
  appShell.classList.toggle('tray-collapsed');
  const isCollapsed = appShell.classList.contains('tray-collapsed');
  trayToggle.textContent = isCollapsed ? '' : '❮';
  window.setTimeout(resizeCanvas, 190);
});

recenterCanvasButton.addEventListener('click', () => {
  recenterCanvas();
});

focusParentNodeButton?.addEventListener('click', () => {
  focusParentNode();
});

playProgramButton.addEventListener('click', () => {
  playProgram();
});

stepProgramButton?.addEventListener('click', () => {
  stepProgram();
});

saveProgramButton?.addEventListener('click', async () => {
  debugSpellcircle('save:click');
  const program = serializeProgram();
  const api = window.SpellcircleFile;
  if (!api?.save) {
    console.warn('Save is unavailable: preload API missing.');
    debugSpellcircle('save:missing-api');
    window.alert('Save is unavailable in this build.');
    return;
  }

  try {
    debugSpellcircle('save:calling-api');
    const result = await api.save(program);
    debugSpellcircle('save:api-result', {
      canceled: Boolean(result?.canceled),
      hasError: Boolean(result?.error),
      filePath: result?.filePath ?? null,
    });
    if (!result || result.canceled) {
      return;
    }

    if (result.error) {
      window.alert(`Save failed: ${result.error}`);
      return;
    }

    if (result.filePath) {
      appendMessageLog(`Saved script: ${result.filePath}`);
    }
  } catch (error) {
    console.error('Save failed:', error);
    debugSpellcircle('save:exception', {
      message: error instanceof Error ? error.message : String(error),
    });
    window.alert(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

loadProgramButton?.addEventListener('click', async () => {
  debugSpellcircle('load:click');
  const api = window.SpellcircleFile;
  if (!api?.load) {
    console.warn('Load is unavailable: preload API missing.');
    debugSpellcircle('load:missing-api');
    window.alert('Load is unavailable in this build.');
    return;
  }

  try {
    debugSpellcircle('load:calling-api');
    const result = await api.load();
    debugSpellcircle('load:api-result', {
      canceled: Boolean(result?.canceled),
      hasError: Boolean(result?.error),
      filePath: result?.filePath ?? null,
      hasProgram: Boolean(result?.program),
    });
    if (!result || result.canceled) {
      return;
    }

    if (result.error) {
      window.alert(`Load failed: ${result.error}`);
      return;
    }

    const ok = window.confirm('This will delete the current script and load a new one. Continue?');
    debugSpellcircle('load:confirm-result', { ok });
    if (!ok) {
      return;
    }

    const success = deserializeProgram(result.program);
    debugSpellcircle('load:deserialize-result', { success });
    if (!success) {
      window.alert('Unable to load script: invalid or unsupported file.');
      return;
    }

    if (result.filePath) {
      appendMessageLog(`Loaded script: ${result.filePath}`);
    }
  } catch (error) {
    console.error('Load failed:', error);
    debugSpellcircle('load:exception', {
      message: error instanceof Error ? error.message : String(error),
    });
    window.alert(`Load failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

lineToolToggle.addEventListener('click', () => {
  lineToolEnabled = !lineToolEnabled;
  lineToolToggle.setAttribute('aria-pressed', String(lineToolEnabled));
  drawScene();
});

variableModalAccept.addEventListener('click', () => {
  closeVariableModal(true);
});

variableModalCancel.addEventListener('click', () => {
  closeVariableModal(false);
});

variableModalBackdrop.addEventListener('click', (event) => {
  if (event.target === variableModalBackdrop) {
    closeVariableModal(false);
  }
});

labelModalAccept.addEventListener('click', () => {
  closeLabelModal(true);
});

labelModalCancel.addEventListener('click', () => {
  closeLabelModal(false);
});

labelModalBackdrop.addEventListener('click', (event) => {
  if (event.target === labelModalBackdrop) {
    closeLabelModal(false);
  }
});

referenceModalAccept.addEventListener('click', () => {
  closeReferenceModal(true);
});

referenceModalCancel.addEventListener('click', () => {
  closeReferenceModal(false);
});

referenceModalBackdrop.addEventListener('click', (event) => {
  if (event.target === referenceModalBackdrop) {
    closeReferenceModal(false);
  }
});

booleanModalAccept.addEventListener('click', () => {
  closeBooleanModal(true);
});

booleanModalCancel.addEventListener('click', () => {
  closeBooleanModal(false);
});

booleanModalBackdrop.addEventListener('click', (event) => {
  if (event.target === booleanModalBackdrop) {
    closeBooleanModal(false);
  }
});

ifElseModalAccept.addEventListener('click', () => {
  closeIfElseModal(true);
});

ifElseModalCancel.addEventListener('click', () => {
  closeIfElseModal(false);
});

ifElseModalBackdrop.addEventListener('click', (event) => {
  if (event.target === ifElseModalBackdrop) {
    closeIfElseModal(false);
  }
});

deleteModalConfirm.addEventListener('click', () => {
  closeDeleteModal(true);
});

deleteModalCancel.addEventListener('click', () => {
  closeDeleteModal(false);
});

deleteModalBackdrop.addEventListener('click', (event) => {
  if (event.target === deleteModalBackdrop) {
    closeDeleteModal(false);
  }
});

variableModalInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    closeVariableModal(true);
  }

  if (event.key === 'Escape') {
    closeVariableModal(false);
  }
});

labelModalNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    closeLabelModal(true);
  }

  if (event.key === 'Escape') {
    closeLabelModal(false);
  }
});

booleanModalOperatorSelect.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    closeBooleanModal(true);
  }

  if (event.key === 'Escape') {
    closeBooleanModal(false);
  }
});

booleanModalCheckbox.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    closeBooleanModal(true);
  }

  if (event.key === 'Escape') {
    closeBooleanModal(false);
  }
});

ifElseModalModeSelect.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    closeIfElseModal(true);
  }

  if (event.key === 'Escape') {
    closeIfElseModal(false);
  }
});

canvas.addEventListener('pointerdown', (event) => {
  if (
    event.button !== 0
    || variableModalBackdrop.classList.contains('is-visible')
    || referenceModalBackdrop.classList.contains('is-visible')
    || booleanModalBackdrop.classList.contains('is-visible')
    || ifElseModalBackdrop.classList.contains('is-visible')
    || deleteModalBackdrop.classList.contains('is-visible')
  ) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const worldPoint = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);

  if (lineToolEnabled) {
    const wireStartTarget = findLineToolStartTarget(worldPoint.x, worldPoint.y);
    if (wireStartTarget) {
      disconnectOutgoing(wireStartTarget.fromGlyph, wireStartTarget.fromOutputIndex ?? 0);
      startWireDrag(
        wireStartTarget.node,
        wireStartTarget.fromGuid,
        wireStartTarget.fromOutputIndex ?? 0,
        wireStartTarget.fromPoint,
        event.pointerId,
        worldPoint.x,
        worldPoint.y,
      );
      canvas.setPointerCapture(event.pointerId);
      drawScene();
      return;
    }
  }

  let connectorTarget = null;
  const canvasRoots = getCanvasRoots();
  const maxConnectorDepth = focusedNode ? 1 : Number.POSITIVE_INFINITY;
  for (let index = canvasRoots.length - 1; index >= 0; index -= 1) {
    connectorTarget = findConnectorTarget(canvasRoots[index], worldPoint.x, worldPoint.y, 0, maxConnectorDepth);
    if (connectorTarget) {
      break;
    }
  }

  if (connectorTarget) {
    panState.active = true;
    panState.moved = false;
    panState.pointerId = event.pointerId;
    panState.lastX = event.clientX;
    panState.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    return;
  }

  const draggableGlyph = findCanvasGlyph(worldPoint.x, worldPoint.y, (glyph) => glyph.type !== 'start');
  if (draggableGlyph) {
    dragState.active = true;
    dragState.moved = false;
    dragState.pointerId = event.pointerId;
    dragState.glyph = draggableGlyph;
    dragState.sourceNode = findNodeByGuid(draggableGlyph.parentNodeGuid);
    panState.lastX = event.clientX;
    panState.lastY = event.clientY;
    dragState.worldX = draggableGlyph.x;
    dragState.worldY = draggableGlyph.y;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.remove('is-connector-hover');
    hideTooltip();
    drawScene();
    return;
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (wireDragState.active && wireDragState.pointerId === event.pointerId) {
    const rect = canvas.getBoundingClientRect();
    const worldPoint = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
    wireDragState.toWorld = { x: worldPoint.x, y: worldPoint.y };
    drawScene();
    return;
  }

  if (dragState.active && dragState.pointerId === event.pointerId) {
    const deltaX = event.clientX - panState.lastX;
    const deltaY = event.clientY - panState.lastY;

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      dragState.moved = true;
    }

    panState.lastX = event.clientX;
    panState.lastY = event.clientY;
    const rect = canvas.getBoundingClientRect();
    const worldPoint = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
    dragState.worldX = worldPoint.x;
    dragState.worldY = worldPoint.y;
    drawScene();
    return;
  }

  if (!panState.active || panState.pointerId !== event.pointerId) {
    updateCanvasHover(event.clientX, event.clientY);
    return;
  }

  const deltaX = event.clientX - panState.lastX;
  const deltaY = event.clientY - panState.lastY;

  if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
    panState.moved = true;
  }

  panState.lastX = event.clientX;
  panState.lastY = event.clientY;
});

canvas.addEventListener('pointerup', (event) => {
  if (wireDragState.active && wireDragState.pointerId === event.pointerId) {
    finishWireDrag(event.clientX, event.clientY);
    return;
  }

  if (dragState.active && dragState.pointerId === event.pointerId) {
    const rect = canvas.getBoundingClientRect();
    const worldPoint = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);

    if (dragState.moved) {
      finishGlyphDrag(worldPoint.x, worldPoint.y);
    } else if (dragState.glyph?.type === 'variable') {
      openVariableModal(dragState.glyph);
    } else if (dragState.glyph?.type === 'label') {
      openLabelModal(dragState.glyph);
    } else if (dragState.glyph?.type === 'reference') {
      openReferenceModal(dragState.glyph);
    } else if (dragState.glyph?.type === 'value') {
      openValueDropdown(dragState.glyph, event.clientX, event.clientY);
    } else if (dragState.glyph?.type === 'goto') {
      openGotoDropdown(dragState.glyph, event.clientX, event.clientY);
    } else if (dragState.glyph?.type === 'boolean') {
      openBooleanModal(dragState.glyph);
    } else if (dragState.glyph?.type === 'ifelse') {
      openIfElseModal(dragState.glyph);
    }

    clearGlyphDrag();
    drawScene();
    updateCanvasHover(event.clientX, event.clientY);
    return;
  }

  if (!panState.moved) {
    const rect = canvas.getBoundingClientRect();
    const worldPoint = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);

    const canvasRoots = getCanvasRoots();
    const maxConnectorDepth = focusedNode ? 1 : Number.POSITIVE_INFINITY;
    for (let index = canvasRoots.length - 1; index >= 0; index -= 1) {
      const connectorTarget = findConnectorTarget(canvasRoots[index], worldPoint.x, worldPoint.y, 0, maxConnectorDepth);
      if (connectorTarget) {
        focusNode(connectorTarget);
        stopPanning(event.pointerId);
        updateCanvasHover(event.clientX, event.clientY);
        return;
      }
    }

    const editableGlyph = findCanvasGlyph(
      worldPoint.x,
      worldPoint.y,
      (glyph) => glyph.type === 'variable' || glyph.type === 'label' || glyph.type === 'start' || glyph.type === 'reference' || glyph.type === 'goto' || glyph.type === 'boolean' || glyph.type === 'ifelse',
    );

    if (editableGlyph?.type === 'variable') {
      openVariableModal(editableGlyph);
    } else if (editableGlyph?.type === 'label') {
      openLabelModal(editableGlyph);
    } else if (editableGlyph?.type === 'start') {
      openLabelModal(editableGlyph);
    } else if (editableGlyph?.type === 'reference') {
      openReferenceModal(editableGlyph);
    } else if (editableGlyph?.type === 'goto') {
      openGotoDropdown(editableGlyph, event.clientX, event.clientY);
    } else if (editableGlyph?.type === 'boolean') {
      openBooleanModal(editableGlyph);
    } else if (editableGlyph?.type === 'ifelse') {
      openIfElseModal(editableGlyph);
    }
  }

  stopPanning(event.pointerId);
  updateCanvasHover(event.clientX, event.clientY);
});

window.addEventListener('pointerup', (event) => {
  if (wireDragState.active && wireDragState.pointerId === event.pointerId) {
    finishWireDrag(event.clientX, event.clientY);
  }
});

canvas.addEventListener('pointercancel', (event) => {
  if (wireDragState.active && wireDragState.pointerId === event.pointerId) {
    clearWireDrag();
    drawScene();
  }

  if (dragState.active && dragState.pointerId === event.pointerId) {
    clearGlyphDrag();
    drawScene();
  }

  stopPanning(event.pointerId);
  canvas.classList.remove('is-connector-hover');
  hideTooltip();
});

canvas.addEventListener('pointerleave', () => {
  canvas.classList.remove('is-connector-hover');
  hideTooltip();
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
}, { passive: false });

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    dropZone.classList.add('is-dropping');
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => {
    dropZone.classList.remove('is-dropping');
  });
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('is-dropping');

  const objectType = event.dataTransfer.getData('application/x-magi-object');
  if (objectType) {
    spawnGlyphAtDrop(objectType, event.clientX, event.clientY);
  }
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  debugSpellcircle('window:load');
  resizeCanvas();

  if (topLevelNodes.length === 0) {
    createRootNodeAt(0, 0);
  }

  setMessageLogCollapsed(true);
  if (messageLogToggle) {
    messageLogToggle.addEventListener('click', () => {
      const nextCollapsed = messageLog?.dataset?.collapsed !== 'true';
      setMessageLogCollapsed(nextCollapsed);
    });
  }

  if (spellcircleDebugEnabled && window.SpellcircleFile?.onDebug) {
    window.SpellcircleFile.onDebug((payload) => {
      console.log('[Spellcircle Debug]', payload);
      const details = payload?.details && Object.keys(payload.details).length > 0
        ? ` ${JSON.stringify(payload.details)}`
        : '';
      appendMessageLog(`[Spellcircle Debug] ${payload?.source ?? 'unknown'}:${payload?.step ?? 'unknown'}${details}`);
    });
    debugSpellcircle('debug-listener:registered');
  } else if (spellcircleDebugEnabled) {
    debugSpellcircle('debug-listener:missing');
  }

  // Ensure tray toggle shows correct icon/label on startup
  trayToggle.textContent = appShell.classList.contains('tray-collapsed') ? '' : '❮';

  window.MagiScript = {
    serializeProgram,
    playProgram,
  };
});
