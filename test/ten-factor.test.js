const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const expectedLines = [
  '1',
  '2',
  '4',
  '8',
  '16',
  '32',
  '64',
  '128',
  '256',
  '512',
  '1024',
];

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env, ...(options.env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('close', (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });
  });
}

function toTrimmedLines(text) {
  const withoutAnsi = String(text).replace(/\u001b\[[0-9;]*m/g, '');

  return withoutAnsi
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

test('CLI prints ten-factor powers of two', async () => {
  const result = await runProcess(process.execPath, ['cli.js', 'demo/ten-factor.spellcircle', '1']);

  assert.equal(result.code, 0, `CLI exited with ${result.code}. stderr:\n${result.stderr}`);
  assert.deepEqual(toTrimmedLines(result.stdout), expectedLines);
});

test('GUI test mode validates ten-factor output and exits', async () => {
  const electronBinary = require('electron');
  const result = await runProcess(electronBinary, ['.', '--', '--test-demo']);

  assert.equal(result.code, 0, `GUI test exited with ${result.code}. stderr:\n${result.stderr}\nstdout:\n${result.stdout}`);
  assert.match(result.stdout, /\[GUI TEST\] PASS/);
});
