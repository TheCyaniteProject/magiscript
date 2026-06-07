# MagiScript Glyph Guide

This guide explains every glyph currently available in the editor and how to use it effectively.

## Core Concepts

- **Node**: a function-like container with its own inner program.
- **Inner ring**: where executable glyphs live.
- **Outer ring**: parameter/value sources for glyphs and child nodes.
- **Start glyph**: the entry point for a node's inner execution chain.

## Building and Wiring Basics

1. Drag glyph cards from the left tray onto a node.
2. Toggle **Line Tool** to display IO connectors.
3. Drag from an output connector to connect:
   - to an **input** connector for execution flow.
   - to a **param input** connector for parameter data (param inputs can only connect to the outer ring).
4. Click or tap glyphs that support editing to open their modal/dropdown.

### Drag behavior tips

- Dragging a glyph onto a child node moves it into that child node.
- Dragging a supported value glyph (`variable`, `reference`, `value`, `boolean`) to a node's outer ring makes it an outer data source.
- Dragging a glyph to a node center connector deletes it.
- `value` glyphs are always kept on the outer ring.

## Execution Model

- Each node starts at its **Start** glyph and follows output links.
- A rolling runtime value is passed from glyph to glyph.
- `variable` state is tracked in runtime context (not by mutating the design-time value directly).
- `ifelse` chooses one of two outputs based on its boolean checks.
- `goto` can jump to a `label` or a node `start` glyph.

## Glyph Reference

## Node

**What it does**

- Represents a nested function/program block.
- Contains its own inner glyphs and outer ring values.

**How to use it**

1. Drop a `Node` card onto the canvas (or into another node).
2. Connect a parent flow glyph to the node's input flow.
3. Optionally connect an outer glyph to the node's param input (deprecated).
4. Put logic inside the node and connect from its `Start` glyph onward.

**Notes**

- Root node gets a default outer `IN` variable. This variable is treated as the rolling runtime value.
- Child nodes get a default outer `Value` glyph wired to their `Start` (deprecated).

## Start

**What it does**

- Entry anchor for a node.
- Can be targeted by `goto`.

**How to use it**

1. Connect `Start` output to the first inner glyph.
2. Rename it (click/tap) if you want jump-friendly names.

## Variable

**What it does**

- Stores a string runtime value keyed by glyph GUID.

**How to use it**

1. Place `Variable` inner ring to assign from rolling value.
2. Place `Variable` outer ring to provide parameter/runtime input.
3. Click/tap to edit name and initial value.

**Runtime behavior**

- Inner `Variable`: writes current rolling value.
- Outer `Variable`: reads current runtime value.

## Reference

**What it does**

- Points to a `Variable` or `Boolean` glyph and acts through that target.

**How to use it**

1. Add `Reference`.
2. Click/tap it and select a target from the dropdown.
3. Use as inner or outer depending on desired behavior.

**Runtime behavior**

- Outer `Reference` to `Variable`: reads variable value.
- Inner `Reference` to `Variable`: writes current value into target variable.
- Outer `Reference` to `Boolean`: returns boolean state/result.

## Value (Deprecated)

**What it does**

- Compatibility glyph for old flows.

**How to use it**

1. Don't. Removing or modifying it may break things.

**Note**

- Runtime already carries rolling value, so this glyph is mostly for compatibility.

## Add

**What it does**

- Adds an operand to the rolling runtime value.

**How to use it**

1. Add `Add` to inner ring.
2. Connect normal flow in/out.
3. Optionally wire an outer glyph into `Add` param input to supply operand.

**Runtime behavior**

- No param connection: uses operand `1`.
- With param connection: evaluates connected outer glyph as operand.

## Subtract

**What it does**

- Subtracts an operand from the rolling runtime value.

**How to use it**

1. Add `Subtract` to inner ring.
2. Optionally wire param input with an outer data glyph.

**Runtime behavior**

- No param connection: subtracts `1`.
- With param connection: subtracts evaluated param value.

## Set Value

**What it does**

- Sets the rolling runtime value to its param input value.

**How to use it**

1. Add `Set Value` in inner ring.
2. Connect an outer data glyph to its param input.
3. Continue flow into a writer glyph (`Variable` or inner `Reference`) if you want to persist it.

**Runtime behavior**

- No param connection: leaves current value unchanged.

## Print

**What it does**

- Logs current rolling runtime value.

**How to use it**

1. Add `Print` in flow where you want to print.
2. Run program and inspect message log/console.

## Label

**What it does**

- Named jump target within a node.

**How to use it**

1. Add `Label` where you want jump landing.
2. Click/tap to rename clearly.
3. Set a `Goto` to target it.

## Goto

**What it does**

- Jumps execution to a selected `Label` or `Start` target.

**How to use it**

1. Add `Goto` in flow.
2. Click/tap and select target label/start.
3. Ensure target exists and has valid onward flow.

**Runtime behavior**

- If target is missing, execution continues as if no jump happened.

## Boolean

**What it does**

- Acts as either:
  - outer literal (`TR`/`FA`), or
  - inner comparator (`LT`, `GT`, `EQ`, `NE`).

**How to use it**

1. Outer literal mode:
   - place on outer ring and click/tap to set checked true/false.
2. Comparator mode:
   - place inner, set operation, and wire param input for comparison value.
3. For branching, drag a boolean onto an `If / Else` glyph to make it owned by that branch.

## If / Else

**What it does**

- Branches flow using boolean checks.
- Output 0 = pass/true, Output 1 = fail/false.

**How to use it**

1. Add `If / Else` to inner ring.
2. Connect both outputs to different next glyphs.
3. Drag up to 3 `Boolean` glyphs onto it to create owned branch conditions.
4. Click/tap to set mode:
   - `AND`: all booleans must pass.
   - `OR`: at least one must pass.

## Practical Recipe

To recreate the demo style flow (`IN + 2`, then double twice):

1. In root node, keep outer `IN` variable.
2. Add inner `Add` and connect outer literal/variable param to provide `2`.
3. Add inner `Add` configured as doubling by wiring current value as needed through outer sources.
4. Chain into `Print`.

Use the `demo/ten-factor.spellcircle` file as a runnable reference:

```bash
magi demo/ten-factor.spellcircle 2
```
