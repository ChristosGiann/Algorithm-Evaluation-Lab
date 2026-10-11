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



const { snapshotStringSearchInput, evaluateStringSearch, compareStringSearch,
  MAX_TEXT_LENGTH, MAX_PATTERN_LENGTH, MAX_ALIGNMENTS } = await import('../src/stringSearch/evaluation.ts');
const input = (text = 'banana', pattern = 'ana') => ({ text, pattern, mode: 'first' });
const trace = (index = 1, alignments = [1], comparisons = 3) => ({ index, alignments, comparisons });
const prepare = result => () => ({ comparisons: 0, search: () => result });
const run = (data, result) => evaluateStringSearch('naive', data, prepare(result), () => 0);

test('string-search validates explicit text/pattern/mode and bounded immutable snapshots', () => {
  for (const data of [null, {}, input([], 'a'), input('a', 1), { ...input(), mode: 'all' },
    { text: 'a', pattern: 'a' }, input('x'.repeat(MAX_TEXT_LENGTH + 1)), input('', 'x'.repeat(MAX_PATTERN_LENGTH + 1))]) {
    assert.throws(() => snapshotStringSearchInput(data), /invalid_string_search_input/);
  }
  const original = input();
  const snapshot = snapshotStringSearchInput(original);
  original.text = 'changed';
  assert.deepEqual(snapshot, input());
  assert.ok(Object.isFrozen(snapshot));
  assert.equal(snapshotStringSearchInput(input('x'.repeat(MAX_TEXT_LENGTH), 'x'.repeat(MAX_PATTERN_LENGTH))).text.length, MAX_TEXT_LENGTH);
});

test('first-match fixtures specify empty, overlapping, absent, longer and repeated patterns', () => {
  for (const [text, pattern, index] of [
    ['', '', 0], ['abc', '', 0], ['', 'a', null], ['a', 'aa', null],
    ['aaaaa', 'aaa', 0], ['banana', 'ana', 1], ['abcabc', 'abc', 0],
    ['abc', 'z', null], ['xxabc', 'abc', 2], ['ABC', 'abc', null],
  ]) {
    const result = run(input(text, pattern), trace(index, index === null ? [] : [index], 0));
    assert.equal(result.correct, true);
    assert.equal(result.found, index !== null);
    assert.deepEqual(result.occurrenceIndexes, index === null ? [] : [index]);
  }
  assert.equal(run(input(), trace(3, [3])).correct, false);
  assert.equal(run(input(), trace(null, [])).correct, false);
  assert.equal(run(input(), trace(0, [0])).correct, false);
});

test('UTF-16 offsets are explicit, case-sensitive and do not normalize Unicode', () => {
  assert.equal(run(input('😀a😀', 'a'), trace(2, [2])).correct, true);
  assert.equal(run(input('😀a😀', '😀'), trace(0, [0])).correct, true);
  assert.equal(run(input('e\u0301', 'é'), trace(null, [])).correct, true);
  assert.equal(run(input('😀', '\uDE00'), trace(1, [1])).correct, true);
});

test('malformed outputs and counters are rejected, while zero and repeated alignments are valid', () => {
  for (const value of [null, {}, trace(-1), trace(4, [4]), trace(1.5), trace(1, []),
    trace(null, [-1]), trace(null, [,]), trace(null, [Infinity]), trace(1, [1], -1),
    trace(1, [1], 0.5), trace(1, [1], Number.MAX_SAFE_INTEGER + 1),
    trace(null, Array(MAX_ALIGNMENTS + 1).fill(0))]) {
    assert.equal(run(input(), value).error, 'invalid_result');
  }
  assert.deepEqual(run(input(), trace(1, [0, 0, 1], 0)).alignments, [0, 0, 1]);
  for (const prepared of [null, {}, { comparisons: -1, search() {} }, { comparisons: 0, search: 1 }]) {
    assert.equal(evaluateStringSearch('kmp', input(), () => prepared).error, 'invalid_result');
  }
});

test('preprocessing and search have separate clocks, counters and detached results', () => {
  const events = [], ticks = [1, 4, 10, 15], alignments = [1];
  const result = evaluateStringSearch('kmp', input(), pattern => {
    events.push('prepare');
    assert.equal(pattern, 'ana');
    return { comparisons: 2, search: text => {
      events.push('search'); assert.equal(text, 'banana'); return trace(1, alignments, 5);
    } };
  }, () => { events.push('clock'); return ticks.shift(); });
  assert.deepEqual(events, ['clock', 'prepare', 'clock', 'clock', 'search', 'clock']);
  assert.equal(result.preprocessingTimeMs, 3);
  assert.equal(result.executionTimeMs, 5);
  assert.equal(result.preprocessingComparisons, 2);
  assert.equal(result.comparisons, 5);
  alignments[0] = 0;
  assert.deepEqual(result.alignments, [1]);
  assert.ok(Object.isFrozen(result.alignments) && Object.isFrozen(result.occurrenceIndexes));
});

test('phase errors and invalid clocks cannot masquerade as successful measurements', () => {
  assert.equal(evaluateStringSearch('kmp', input(), () => { throw Error(); }).error, 'preprocessing_error');
  assert.equal(evaluateStringSearch('kmp', input(), () => ({ comparisons: 0, search() { throw Error(); } })).error, 'runner_error');
  for (const ticks of [[2, 1], [NaN, 1], [0, Infinity], [0, 1, 5, 4], [0, 1, 0, Infinity]]) {
    assert.equal(evaluateStringSearch('naive', input(), prepare(trace()), () => ticks.shift()).error, 'invalid_clock');
  }
  assert.throws(() => evaluateStringSearch('unknown', input(), prepare(trace())), /unknown_algorithm/);
});

test('comparison prepares each entry with identical strings and isolates failures', () => {
  const calls = [], data = input();
  const results = compareStringSearch(data, [
    { algorithm: 'naive', prepare() { throw Error(); } },
    { algorithm: 'kmp', prepare(pattern) { calls.push(pattern); return {
      comparisons: 2, search(text) { calls.push(text); return trace(); },
    }; } },
    { algorithm: 'rabinKarp', prepare: prepare(trace()) },
  ], () => 0);
  assert.equal(results[0].error, 'preprocessing_error');
  assert.equal(results[1].correct, true);
  assert.equal(results[2].correct, true);
  assert.deepEqual(calls, ['ana', 'banana']);
  assert.deepEqual(data, input());
  for (const entries of [[], [{ algorithm: 'bad' }], [{ algorithm: 'naive' }, { algorithm: 'naive' }]]) {
    assert.throws(() => compareStringSearch(data, entries), /invalid_selection/);
  }
});
