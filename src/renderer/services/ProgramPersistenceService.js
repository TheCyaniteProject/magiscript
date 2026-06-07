class ProgramPersistenceService {
  static serializeNode(node, nodes, glyphs, deps) {
    const { updateNodeOrdering, isNode } = deps;

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
      nextGlyphGuid: node.startGlyph.getOutputTarget(0),
      ...(node.startGlyph.name !== undefined ? { name: node.startGlyph.name } : {}),
    };

    node.glyphs.forEach((glyph) => {
      if (isNode(glyph)) {
        ProgramPersistenceService.serializeNode(glyph, nodes, glyphs, deps);
        return;
      }

      glyphs[glyph.guid] = {
        guid: glyph.guid,
        type: glyph.type,
        parentNodeGuid: glyph.parentNodeGuid,
        nextGlyphGuid: glyph.getOutputTarget(0),
        ...(glyph.getOutputTarget(1) !== null ? { nextGlyphGuidFalse: glyph.getOutputTarget(1) } : {}),
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
        nextGlyphGuid: glyph.getOutputTarget(0),
        ...(glyph.getOutputTarget(1) !== null ? { nextGlyphGuidFalse: glyph.getOutputTarget(1) } : {}),
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

  static serializeProgram(deps) {
    const {
      topLevelNodes,
      debugSpellcircle,
      layoutAllNodes,
    } = deps;

    debugSpellcircle('serialize:start', {
      topLevelNodeCount: topLevelNodes.length,
    });

    layoutAllNodes();
    const nodes = {};
    const glyphs = {};
    topLevelNodes.forEach((node) => ProgramPersistenceService.serializeNode(node, nodes, glyphs, deps));

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

  static hydrateGlyphFromSerialized(serialized, deps) {
    const {
      createVariableName,
      createLabelName,
      Glyph,
      StartGlyph,
      VariableGlyph,
      ValueGlyph,
      LabelGlyph,
      GotoGlyph,
      ReferenceGlyph,
      AddGlyph,
      SubtractGlyph,
      SetValueGlyph,
      PrintGlyph,
      BooleanGlyph,
      IfElseGlyph,
      CHILD_BASE_RADIUS,
      BASE_NODE_LINE_WIDTH,
    } = deps;

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
        glyph = new SetValueGlyph({ ...base });
        break;
      case 'print':
      case 'output':
        glyph = new PrintGlyph(base);
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

    glyph.setOutputTarget(serialized.nextGlyphGuid ?? null, 0);
    glyph.setOutputTarget(serialized.nextGlyphGuidFalse ?? null, 1);
    glyph.x = 0;
    glyph.y = 0;
    glyph.radius = CHILD_BASE_RADIUS;
    glyph.lineWidth = BASE_NODE_LINE_WIDTH;
    glyph.ring = serialized.ring || 'inner';

    return glyph;
  }

  static deserializeProgram(program, deps) {
    const {
      debugSpellcircle,
      ROOT_NODE_RADIUS,
      getStrokeWidthForRadius,
      NodeGlyph,
      createStartGlyph,
      createNodeName,
      createVariableName,
      createLabelName,
      resetProgramState,
      topLevelNodes,
      setFocusedNode,
      layoutAllNodes,
      drawScene,
    } = deps;

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

      const hydrated = ProgramPersistenceService.hydrateGlyphFromSerialized(serialized, {
        ...deps,
        createVariableName,
        createLabelName,
      });
      hydratedGlyphByGuid.set(guid, hydrated);
      return hydrated;
    };

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

    let variableCount = 0;
    let nodeCount = 0;
    for (const glyph of hydratedGlyphByGuid.values()) {
      if (glyph.type === 'variable' && typeof glyph.name === 'string') {
        const variableMatch = glyph.name.match(/^variable_(\d+)$/);
        if (variableMatch) {
          variableCount = Math.max(variableCount, Number(variableMatch[1]) || 0);
        }
      }

      if (glyph.type === 'start' && typeof glyph.name === 'string') {
        const nodeMatch = glyph.name.match(/^node_(\d+)$/);
        if (nodeMatch) {
          nodeCount = Math.max(nodeCount, Number(nodeMatch[1]) || 0);
        }
      }
    }

    resetProgramState();
    roots.forEach((node) => topLevelNodes.push(node));
    setFocusedNode(roots[0]);

    layoutAllNodes();
    drawScene();
    debugSpellcircle('deserialize:complete', {
      rootCount: roots.length,
      focusedNodeGuid: roots[0]?.guid ?? null,
    });

    return {
      ok: true,
      variableCount,
      nodeCount,
    };
  }
}

globalThis.ProgramPersistenceService = ProgramPersistenceService;
