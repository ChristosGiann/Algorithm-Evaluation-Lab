import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL
      && existsSync(fileURLToPath(new URL(specifier + '.ts', context.parentURL)))) {
      return next(specifier + '.ts', context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext },
      }).outputText,
    };
    return next(url, context);
  },
});


const { snapshotSearchingInput, evaluateSearching, compareSearching, SEARCHING_DEFINITIONS,
  MAX_SEARCHING_SIZE, MAX_SEARCHING_PROBES } = await import('../src/searching/evaluation.ts');
const input = (values = [1, 2, 3], target = 2) => ({ values, target });
const trace = (index = 1, probes = [1], comparisons = probes.length) => ({ index, probes, comparisons });
const run = (data, result) => evaluateSearching('linear', data, () => result, () => 0);

test('searching snapshots validate numeric collections, targets and size, preserving order', () => {
  for (const data of [null, {}, input('abc'), input([NaN]), input([Infinity]), input(['2']),
    input([, 2]), input([], NaN), input([], '2'), input(Array(MAX_SEARCHING_SIZE + 1).fill(1))]) {
    assert.throws(() => snapshotSearchingInput(data), /invalid_searching_input/);
  }
  const source = input([3, -1.5, 3, 0], -1.5);
  const saved = snapshotSearchingInput(source);
  source.values[0] = 9;
  assert.deepEqual(saved, input([3, -1.5, 3, 0], -1.5));
  assert.ok(Object.isFrozen(saved) && Object.isFrozen(saved.values));
  assert.equal(snapshotSearchingInput(input(Array(MAX_SEARCHING_SIZE).fill(1))).values.length, MAX_SEARCHING_SIZE);
  assert.deepEqual(snapshotSearchingInput(input([], 0)), input([], 0));
});

test('preconditions are explicit, checked before timing/execution, and never sort input', () => {
  assert.equal(SEARCHING_DEFINITIONS.linear.requiresSorted, false);
  for (const algorithm of ['binary', 'jump', 'exponential']) {
    const result = evaluateSearching(algorithm, input([3, 1, 2]), () => assert.fail('runner called'),
      () => assert.fail('clock called'));
    assert.deepEqual(result, { algorithm, status: 'error', error: 'requires_sorted_input' });
    for (const values of [[], [1], [1, 1, 2]]) {
      assert.equal(evaluateSearching(algorithm, input(values, 9), () => trace(null, []), () => 0).status, 'completed');
    }
  }
  assert.equal(run(input([3, 2, 1]), trace()).correct, true);
});

test('correctness handles absent, empty, zero index, duplicate matches and wrong answers', () => {
  const cases = [
    [input([], 1), trace(null, []), false, true],
    [input([1], 1), trace(0, [0]), true, true],
    [input([1], 2), trace(null, [0]), false, true],
    [input([2, 2, 2]), trace(2, [2]), true, true],
    [input(), trace(0, [0]), true, false],
    [input(), trace(null, [0, 1, 2]), false, false],
    [input([-1.5, 0], -1.5), trace(0, [0]), true, true],
  ];
  for (const [data, result, found, correct] of cases) {
    assert.deepEqual({ found: run(data, result).found, correct: run(data, result).correct }, { found, correct });
  }
});

test('result validation rejects malformed metrics and traces without conflating incorrect answers', () => {
  for (const result of [null, {}, trace(-1), trace(3), trace(1.5), trace(1, []),
    trace(null, [3]), trace(null, [,]), trace(null, [NaN]), trace(null, [], -1),
    trace(null, [], 0.5), trace(null, [], Infinity), trace(null, [0], 0),
    trace(null, Array(MAX_SEARCHING_PROBES + 1).fill(0))]) {
    assert.equal(run(input(), result).error, 'invalid_result');
  }
  const repeated = run(input(), trace(1, [0, 0, 1], 5));
  assert.equal(repeated.probeCount, 3);
  assert.equal(repeated.comparisons, 5);
});

test('search timing surrounds only runner and result traces are detached', () => {
  const events = [];
  const probes = [1];
  let tick = 0;
  const result = evaluateSearching('binary', input(), fresh => {
    events.push('search');
    assert.ok(Object.isFrozen(fresh.values));
    return trace(1, probes);
  }, () => { events.push('clock'); return tick++ * 2.5; });
  assert.deepEqual(events, ['clock', 'search', 'clock']);
  assert.equal(result.executionTimeMs, 2.5);
  probes[0] = 0;
  assert.deepEqual(result.probes, [1]);
  assert.ok(Object.isFrozen(result.probes));
  for (const times of [[2, 1], [NaN, 1], [0, Infinity]]) {
    assert.equal(evaluateSearching('linear', input(), () => trace(), () => times.shift()).error, 'invalid_clock');
  }
  assert.equal(evaluateSearching('linear', input(), () => { throw Error(); }).error, 'runner_error');
  assert.throws(() => evaluateSearching('unknown', input(), () => trace()), /unknown_algorithm/);
});

test('same-input comparison isolates failures, snapshots and per-algorithm preconditions', () => {
  const source = input([3, 2, 1]);
  let first;
  const results = compareSearching(source, [
    { algorithm: 'linear', search: fresh => { first = fresh; return trace(); } },
    { algorithm: 'binary', search: () => assert.fail('unsorted binary called') },
  ]);
  assert.equal(results[0].correct, true);
  assert.equal(results[1].error, 'requires_sorted_input');
  assert.deepEqual(source.values, [3, 2, 1]);
  const inputs = [];
  const next = compareSearching(input(), [
    { algorithm: 'linear', search: fresh => { inputs.push(fresh); fresh.values[0] = 99; } },
    { algorithm: 'binary', search: fresh => { inputs.push(fresh); return trace(); } },
  ], () => 0);
  assert.equal(next[0].error, 'runner_error');
  assert.equal(next[1].correct, true);
  assert.notEqual(inputs[0], inputs[1]);
  assert.notEqual(first.values, source.values);
  for (const entries of [[], [{ algorithm: 'unknown' }], [{ algorithm: 'linear' }, { algorithm: 'linear' }]]) {
    assert.throws(() => compareSearching(input(), entries), /invalid_selection/);
  }
});
