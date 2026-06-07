#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const MAX_EXECUTION_STEPS = 100000;

function printUsage() {
  console.error('Usage: magi <program.spellcircle> <int>');
  console.error('Example: magi demo/ten-factor.spellcircle 2');
}

function parseCliArgs(argv) {
  const args = argv.slice(2);

  if (args.length !== 2 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  const [programPathArg, inputValueArg] = args;
  if (!/^-?\d+$/.test(inputValueArg)) {
    console.error(`Input must be an integer. Received: ${inputValueArg}`);
    process.exit(1);
  }

  return {
    programPath: path.resolve(process.cwd(), programPathArg),
    inputValue: Number.parseInt(inputValueArg, 10),
  };
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

function isExecutionJump(value) {
  return Boolean(value)
    && typeof value === 'object'
    && value.kind === 'goto'
    && typeof value.targetLabelGuid === 'string';
}

function getOutputTarget(glyph, outputIndex = 0) {
  if (!glyph) {
    return null;
  }

  if (outputIndex === 1) {
    return glyph.nextGlyphGuidFalse ?? null;
  }

  return glyph.nextGlyphGuid ?? null;
}

function parseProgram(programJson) {
  if (!programJson || typeof programJson !== 'object') {
    throw new Error('Invalid spellcircle JSON payload.');
  }

  if (!Array.isArray(programJson.rootNodeGuids) || !programJson.nodes || !programJson.glyphs) {
    throw new Error('Spellcircle is missing required fields: rootNodeGuids, nodes, glyphs.');
  }

  const serializedNodes = programJson.nodes;
  const serializedGlyphs = programJson.glyphs;

  const nodesByGuid = new Map();
  Object.values(serializedNodes).forEach((node) => {
    nodesByGuid.set(node.guid, {
      guid: node.guid,
      type: 'node',
      parentNodeGuid: node.parentNodeGuid ?? null,
      isRoot: Boolean(node.isRoot),
      startGlyph: null,
      glyphs: [],
      outerGlyphs: [],
    });
  });

  const glyphByGuid = new Map();
  Object.values(serializedGlyphs).forEach((glyph) => {
    glyphByGuid.set(glyph.guid, {
      guid: glyph.guid,
      type: glyph.type,
      parentNodeGuid: glyph.parentNodeGuid ?? null,
      ring: glyph.ring || 'inner',
      name: glyph.name,
      value: glyph.value,
      inputIndex: glyph.inputIndex,
      operand: glyph.operand,
      targetLabelGuid: glyph.targetLabelGuid,
      referenceGlyphGuid: glyph.referenceGlyphGuid,
      ownerIfGlyphGuid: glyph.ownerIfGlyphGuid,
      operation: glyph.operation,
      checked: Boolean(glyph.checked),
      mode: glyph.mode,
      lastResult: 0,
      nextGlyphGuid: glyph.nextGlyphGuid ?? null,
      nextGlyphGuidFalse: glyph.nextGlyphGuidFalse ?? null,
    });
  });

  nodesByGuid.forEach((runtimeNode) => {
    const serializedNode = serializedNodes[runtimeNode.guid];
    if (!serializedNode) {
      return;
    }

    const glyphGuids = Array.isArray(serializedNode.glyphGuids) ? serializedNode.glyphGuids : [];
    const outerGlyphGuids = Array.isArray(serializedNode.outerGlyphGuids) ? serializedNode.outerGlyphGuids : [];

    if (glyphGuids.length === 0) {
      throw new Error(`Node ${runtimeNode.guid} has no glyphGuids.`);
    }

    const startGlyph = glyphByGuid.get(glyphGuids[0]);
    if (!startGlyph || startGlyph.type !== 'start') {
      throw new Error(`Node ${runtimeNode.guid} has invalid start glyph.`);
    }

    runtimeNode.startGlyph = startGlyph;
    runtimeNode.glyphs = glyphGuids.slice(1).map((guid) => {
      if (nodesByGuid.has(guid)) {
        return nodesByGuid.get(guid);
      }
      const glyph = glyphByGuid.get(guid);
      if (!glyph) {
        throw new Error(`Missing glyph reference: ${guid}`);
      }
      return glyph;
    });

    runtimeNode.outerGlyphs = outerGlyphGuids.map((guid) => {
      const glyph = glyphByGuid.get(guid);
      if (!glyph) {
        throw new Error(`Missing outer glyph reference: ${guid}`);
      }
      return glyph;
    });
  });

  const rootNodes = programJson.rootNodeGuids.map((guid) => {
    const node = nodesByGuid.get(guid);
    if (!node) {
      throw new Error(`Missing root node: ${guid}`);
    }
    return node;
  });

  return {
    rootNodes,
    nodesByGuid,
    glyphByGuid,
  };
}

function findNodeByGuid(targetGuid, nodes) {
  for (const node of nodes) {
    if (node.guid === targetGuid) {
      return node;
    }

    const nestedNodes = node.glyphs.filter((glyph) => glyph.type === 'node');
    const nestedMatch = findNodeByGuid(targetGuid, nestedNodes);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

function findGlyphByGuid(targetGuid, nodes) {
  for (const node of nodes) {
    if (node.startGlyph.guid === targetGuid) {
      return node.startGlyph;
    }

    for (const glyph of [...node.outerGlyphs, ...node.glyphs]) {
      if (glyph.guid === targetGuid) {
        return glyph;
      }

      if (glyph.type === 'node') {
        const nestedGlyph = findGlyphByGuid(targetGuid, [glyph]);
        if (nestedGlyph) {
          return nestedGlyph;
        }
      }
    }
  }

  return null;
}

function collectVariableGlyphs(nodes, results = []) {
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

      if (glyph.type === 'node') {
        collectVariableGlyphs([glyph], results);
      }
    });
  });

  return results;
}

function collectReferenceableGlyphs(nodes, results = []) {
  nodes.forEach((node) => {
    node.outerGlyphs.forEach((glyph) => {
      if (glyph.type === 'variable' || glyph.type === 'boolean') {
        results.push(glyph);
      }
    });

    node.glyphs.forEach((glyph) => {
      const isOwnedBoolean = glyph.type === 'boolean' && Boolean(glyph.ownerIfGlyphGuid);
      if (glyph.type === 'variable' || (glyph.type === 'boolean' && !isOwnedBoolean)) {
        results.push(glyph);
      }

      if (glyph.type === 'node') {
        collectReferenceableGlyphs([glyph], results);
      }
    });
  });

  return results;
}

function findIncomingOuterConnection(node, targetGuid) {
  return node.outerGlyphs.find((glyph) => getOutputTarget(glyph, 0) === targetGuid) || null;
}

function getOwnedBooleans(ifGlyph, node) {
  if (!node) {
    return [];
  }

  return node.glyphs.filter((glyph) => glyph.type === 'boolean' && glyph.ownerIfGlyphGuid === ifGlyph.guid);
}

function getNodeStartY(node) {
  return Number.isFinite(node?.startGlyph?.y) ? node.startGlyph.y : 0;
}

function getEntryNode(rootNodes) {
  if (rootNodes.length === 0) {
    return null;
  }

  if (rootNodes.length === 1) {
    return rootNodes[0];
  }

  return [...rootNodes].sort((left, right) => getNodeStartY(left) - getNodeStartY(right))[0];
}

function buildNodeExecutionLookup(node) {
  const map = new Map();
  map.set(node.startGlyph.guid, node.startGlyph);
  node.glyphs.forEach((glyph) => {
    map.set(glyph.guid, glyph);
  });
  return map;
}

function createRuntime(rootNodes) {
  const runtimeState = {
    rootNodes,
    runtimeContext: null,
    steps: 0,
  };

  function assertStepBudget() {
    runtimeState.steps += 1;
    if (runtimeState.steps > MAX_EXECUTION_STEPS) {
      throw new Error(`Execution stopped after ${MAX_EXECUTION_STEPS} steps (possible infinite loop).`);
    }
  }

  function getRuntimeVar(glyph) {
    if (!runtimeState.runtimeContext?.vars) {
      return glyph.value;
    }

    return runtimeState.runtimeContext.vars.has(glyph.guid)
      ? runtimeState.runtimeContext.vars.get(glyph.guid)
      : glyph.value;
  }

  function setRuntimeVar(glyph, nextValue) {
    if (!runtimeState.runtimeContext) {
      runtimeState.runtimeContext = createRuntimeContext();
    }

    const normalized = nextValue === null || nextValue === undefined ? 'null' : String(nextValue);
    runtimeState.runtimeContext.vars.set(glyph.guid, normalized);
  }

  function getReferenceTarget(glyph) {
    if (!glyph.referenceGlyphGuid) {
      return null;
    }

    return findGlyphByGuid(glyph.referenceGlyphGuid, runtimeState.rootNodes);
  }

  function resolveGotoTarget(glyph) {
    if (!glyph.targetLabelGuid) {
      return null;
    }

    const target = findGlyphByGuid(glyph.targetLabelGuid, runtimeState.rootNodes);
    return (target?.type === 'label' || target?.type === 'start') ? target : null;
  }

  function resetBooleanRuntimeState() {
    collectReferenceableGlyphs(runtimeState.rootNodes).forEach((glyph) => {
      if (glyph.type === 'boolean') {
        glyph.lastResult = 0;
      }
    });
  }

  function createRuntimeContext() {
    const vars = new Map();
    collectVariableGlyphs(runtimeState.rootNodes).forEach((glyph) => {
      vars.set(glyph.guid, glyph.value);
    });
    return { vars };
  }

  function getRollingValueGlyph(entryNode) {
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

    return entryNode.outerGlyphs.find(
      (glyph) => glyph.type === 'variable' && String(glyph.name || '').toUpperCase() === 'IN',
    ) || null;
  }

  function getRollingRuntimeValue(entryNode, fallbackValue) {
    const rollingGlyph = getRollingValueGlyph(entryNode);
    if (!rollingGlyph) {
      return fallbackValue;
    }

    return getRuntimeVar(rollingGlyph);
  }

  function setRollingRuntimeValue(entryNode, nextValue) {
    const rollingGlyph = getRollingValueGlyph(entryNode);
    if (!rollingGlyph) {
      return;
    }

    setRuntimeVar(rollingGlyph, nextValue);
  }

  function evaluateOuterGlyphValue(entryNode, glyph, directInput) {
    if (!glyph) {
      return directInput;
    }

    if (glyph.type === 'value') {
      return getRollingRuntimeValue(entryNode, directInput);
    }

    if (glyph.type === 'variable') {
      return getRuntimeVar(glyph);
    }

    if (glyph.type === 'reference') {
      const target = getReferenceTarget(glyph);
      if (target?.type === 'boolean') {
        return target.ring === 'outer' ? (target.checked ? 1 : 0) : (target.lastResult ?? 0);
      }

      if (!target) {
        return directInput;
      }

      return target.type === 'variable' ? getRuntimeVar(target) : directInput;
    }

    if (glyph.type === 'boolean') {
      return glyph.checked ? 1 : 0;
    }

    return directInput;
  }

  function evaluateOwnedBooleanGlyph(node, glyph, currentValue, directInput, ownerGlyph = null) {
    const paramOwnerGuid = ownerGlyph?.guid ?? glyph.guid;
    const paramSource = findIncomingOuterConnection(node, paramOwnerGuid);
    const comparisonValue = paramSource ? evaluateOuterGlyphValue(node, paramSource, directInput) : 0;
    glyph.lastResult = evaluateBooleanOperation(glyph.operation, currentValue, comparisonValue) ? 1 : 0;
    return glyph.lastResult;
  }

  function evaluateIfElseCondition(node, glyph, currentValue, directInput) {
    const ownedBooleans = getOwnedBooleans(glyph, node);
    if (ownedBooleans.length === 0) {
      return true;
    }

    const results = ownedBooleans.map(
      (ownedBoolean) => evaluateOwnedBooleanGlyph(node, ownedBoolean, currentValue, directInput, glyph) === 1,
    );

    return glyph.mode === 'or' ? results.some(Boolean) : results.every(Boolean);
  }

  function resolveParamInputForChild(parentNode, childNodeGuid, directInput) {
    const paramSource = findIncomingOuterConnection(parentNode, childNodeGuid);
    if (!paramSource) {
      return null;
    }

    return evaluateOuterGlyphValue(parentNode, paramSource, directInput);
  }

  function executeGlyph(node, glyph, currentValue, directInput) {
    assertStepBudget();

    switch (glyph.type) {
      case 'start':
      case 'value':
      case 'label':
        return currentValue;
      case 'variable':
        if (glyph.ring === 'outer') {
          return getRuntimeVar(glyph);
        }
        setRuntimeVar(glyph, currentValue);
        return currentValue;
      case 'reference': {
        const target = getReferenceTarget(glyph);
        if (glyph.ring === 'outer') {
          if (target?.type === 'boolean') {
            return target.ring === 'outer'
              ? (target.checked ? 1 : (target.lastResult ?? 0))
              : (target.lastResult ?? 0);
          }

          if (!target) {
            return currentValue;
          }

          return target.type === 'variable' ? getRuntimeVar(target) : currentValue;
        }

        if (target?.type === 'variable') {
          setRuntimeVar(target, currentValue);
        }

        return currentValue;
      }
      case 'add': {
        const paramSource = findIncomingOuterConnection(node, glyph.guid);
        const operandValue = paramSource
          ? evaluateOuterGlyphValue(node, paramSource, directInput)
          : 1;
        const nextValue = coerceNumber(currentValue) + coerceNumber(operandValue);
        setRollingRuntimeValue(node, nextValue);
        return nextValue;
      }
      case 'subtract': {
        const paramSource = findIncomingOuterConnection(node, glyph.guid);
        const operandValue = paramSource
          ? evaluateOuterGlyphValue(node, paramSource, directInput)
          : 1;
        const nextValue = coerceNumber(currentValue) - coerceNumber(operandValue);
        setRollingRuntimeValue(node, nextValue);
        return nextValue;
      }
      case 'setvalue': {
        const paramSource = findIncomingOuterConnection(node, glyph.guid);
        const nextValue = paramSource
          ? evaluateOuterGlyphValue(node, paramSource, directInput)
          : currentValue;
        setRollingRuntimeValue(node, nextValue);
        return nextValue;
      }
      case 'print':
      case 'output':
        console.log(currentValue);
        return currentValue;
      case 'boolean':
        evaluateOwnedBooleanGlyph(node, glyph, currentValue, directInput);
        return currentValue;
      case 'ifelse':
        glyph.lastResult = evaluateIfElseCondition(node, glyph, currentValue, directInput) ? 1 : 0;
        return currentValue;
      case 'goto': {
        const target = resolveGotoTarget(glyph);
        return target
          ? { kind: 'goto', targetLabelGuid: target.guid, value: currentValue }
          : currentValue;
      }
      default:
        return currentValue;
    }
  }

  function executeNodeFrom(node, startGuid, currentValue, directInput) {
    const lookup = buildNodeExecutionLookup(node);
    let currentGuid = startGuid;

    while (currentGuid) {
      assertStepBudget();

      const glyph = lookup.get(currentGuid) || findNodeByGuid(currentGuid, [node]);
      if (!glyph) {
        break;
      }

      if (glyph.type === 'node') {
        const childParamValue = resolveParamInputForChild(node, glyph.guid, directInput);
        const childResult = executeNode(glyph, currentValue, childParamValue);
        if (isExecutionJump(childResult)) {
          return childResult;
        }
        currentValue = childResult;
      } else {
        const glyphResult = executeGlyph(node, glyph, currentValue, directInput);
        if (isExecutionJump(glyphResult)) {
          return glyphResult;
        }
        currentValue = glyphResult;
      }

      if (glyph.type === 'ifelse') {
        currentGuid = glyph.lastResult === 1
          ? getOutputTarget(glyph, 0)
          : getOutputTarget(glyph, 1);
      } else {
        currentGuid = getOutputTarget(glyph, 0);
      }
    }

    return currentValue;
  }

  function executeNode(node, incomingValue, paramValue = null) {
    const directInput = incomingValue;
    const startInputSource = findIncomingOuterConnection(node, node.startGlyph.guid);
    const currentValue = startInputSource
      ? evaluateOuterGlyphValue(node, startInputSource, directInput)
      : directInput;

    return executeNodeFrom(node, getOutputTarget(node.startGlyph, 0), currentValue, directInput, paramValue);
  }

  function executeFromLabel(labelGlyph, incomingValue) {
    const targetNode = labelGlyph?.parentNodeGuid ? findNodeByGuid(labelGlyph.parentNodeGuid, runtimeState.rootNodes) : null;
    if (!targetNode) {
      return incomingValue;
    }

    return executeNodeFrom(targetNode, labelGlyph.guid, incomingValue, incomingValue);
  }

  function run(inputValue) {
    const entryNode = getEntryNode(runtimeState.rootNodes);
    if (!entryNode) {
      throw new Error('No entry node found in spellcircle.');
    }

    runtimeState.runtimeContext = createRuntimeContext();
    resetBooleanRuntimeState();

    const inGlyph = entryNode.outerGlyphs.find(
      (glyph) => glyph.type === 'variable' && String(glyph.name || '').toUpperCase() === 'IN',
    );

    if (!inGlyph) {
      throw new Error('Entry node has no IN variable glyph.');
    }

    inGlyph.value = String(inputValue);
    setRuntimeVar(inGlyph, inputValue);

    let result = executeNode(entryNode, null);

    while (isExecutionJump(result)) {
      assertStepBudget();

      const targetLabel = findGlyphByGuid(result.targetLabelGuid, runtimeState.rootNodes);
      if (!targetLabel) {
        result = result.value;
        break;
      }

      if (targetLabel.type === 'label') {
        result = executeFromLabel(targetLabel, result.value);
      } else if (targetLabel.type === 'start') {
        const targetNode = targetLabel.parentNodeGuid
          ? findNodeByGuid(targetLabel.parentNodeGuid, runtimeState.rootNodes)
          : null;
        if (!targetNode) {
          result = result.value;
          break;
        }
        result = executeNodeFrom(targetNode, targetLabel.guid, result.value, result.value);
      } else {
        result = result.value;
        break;
      }
    }

    return result;
  }

  return {
    run,
  };
}

async function main() {
  const { programPath, inputValue } = parseCliArgs(process.argv);

  const content = await fs.readFile(programPath, 'utf8');
  const parsed = JSON.parse(content);
  const { rootNodes } = parseProgram(parsed);

  const runtime = createRuntime(rootNodes);
  runtime.run(inputValue);
}

main().catch((error) => {
  console.error(`magi failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
