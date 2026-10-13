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
  MAX_SEARCHING_SIZE, MAX_SEARCHING_PROBES, SEARCHING_ALGORITHMS } = await import('../src/searching/evaluation.ts');
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

const { linear } = await import('../src/searching/linear.ts');
test('Linear Search covers unsorted/sorted edges with exact deterministic counters', () => {
  for (const [values, target] of [[[], 2], [[2], 2], [[2], 1], [[3, 2, 1], 3],
    [[3, 2, 1], 2], [[3, 2, 1], 1], [[2, 1, 2], 2], [[-1.5, 0, 7], 0],
    [[1, 2, 3], 9]]) {
    const data = snapshotSearchingInput(input(values, target));
    const expected = values.indexOf(target);
    const probes = Array.from({length: expected < 0 ? values.length : expected + 1}, (_, i) => i);
    assert.deepEqual(linear(data), {index: expected < 0 ? null : expected, probes, comparisons: probes.length});
    const result = evaluateSearching('linear', data, linear, () => 0);
    assert.equal(result.correct, true);
    assert.equal(result.found, expected >= 0);
    assert.deepEqual(data.values, values);
    assert.deepEqual(linear(data), linear(data));
  }
});

test('Linear Search uses common comparison and isolates traces at the maximum input size', () => {
  const values = Array.from({length: MAX_SEARCHING_SIZE}, (_, i) => MAX_SEARCHING_SIZE - i);
  const data = snapshotSearchingInput(input(values, 1));
  const first = linear(data);
  assert.equal(first.index, MAX_SEARCHING_SIZE - 1);
  assert.equal(first.comparisons, MAX_SEARCHING_SIZE);
  first.probes.length = 0;
  const [result] = compareSearching(data, [{algorithm: 'linear', search: linear}], () => 0);
  assert.equal(result.correct, true);
  assert.equal(result.probeCount, MAX_SEARCHING_SIZE);
  assert.deepEqual(data.values, values);
});

const { binary } = await import('../src/searching/binary.ts');
test('Binary Search handles sorted boundaries, duplicates and absent targets without mutation', () => {
  for (const values of [[], [2], [1, 2], [-3, -1.5, 0, 2, 2, 7], Array(12).fill(2)]) {
    for (const target of [-5, -3, -1.5, 0, 1, 2, 7, 9]) {
      const data = snapshotSearchingInput(input(values, target));
      const expectedFound = values.includes(target);
      const result = evaluateSearching('binary', data, binary, () => 0);
      assert.equal(result.status, 'completed');
      assert.equal(result.correct, true);
      assert.equal(result.found, expectedFound);
      assert.equal(result.index === null ? !expectedFound : values[result.index] === target, true);
      assert.deepEqual(binary(data), binary(data));
      assert.deepEqual(data.values, values);
    }
  }
});

test('Binary Search midpoint and comparison counts are deterministic', () => {
  const values = [1, 2, 3, 4, 5, 6, 7];
  assert.deepEqual(binary(input(values, 4)), {index: 3, probes: [3], comparisons: 1});
  assert.deepEqual(binary(input(values, 1)), {index: 0, probes: [3, 1, 0], comparisons: 5});
  assert.deepEqual(binary(input(values, 7)), {index: 6, probes: [3, 5, 6], comparisons: 5});
  assert.deepEqual(binary(input(values, 8)), {index: null, probes: [3, 5, 6], comparisons: 6});
  assert.deepEqual(binary(input([], 8)), {index: null, probes: [], comparisons: 0});
});

test('Binary Search participates in comparison, rejects unsorted input and isolates large traces', () => {
  const entries = [{algorithm: 'linear', search: linear}, {algorithm: 'binary', search: binary}];
  const unsorted = input([3, 1, 2], 1);
  const rejected = compareSearching(unsorted, entries, () => 0);
  assert.equal(rejected[0].correct, true);
  assert.equal(rejected[1].error, 'requires_sorted_input');
  assert.deepEqual(unsorted.values, [3, 1, 2]);
  const values = Array.from({length: MAX_SEARCHING_SIZE}, (_, i) => i * 2);
  for (const target of [0, 9998, 19998, -1, 19999]) {
    const data = snapshotSearchingInput(input(values, target));
    const first = binary(data);
    const expected = structuredClone(first);
    first.probes.length = 0;
    assert.deepEqual(binary(data), expected);
    const results = compareSearching(data, entries, () => 0);
    assert.ok(results.every(result => result.correct));
    assert.ok(expected.probes.length <= 14);
  }
});

const { jump } = await import('../src/searching/jump.ts');
test('Jump Search handles small arrays, block boundaries, duplicates and absent targets', () => {
  for (const values of [[], [2], [1, 2], [1, 2, 3], [-1.5, 0, 0, 2],
    Array(10).fill(2), Array.from({length: 10}, (_, i) => i * 2)]) {
    for (const target of [-2, -1.5, 0, 1, 2, 3, 4, 6, 10, 16, 18, 19]) {
      const data = snapshotSearchingInput(input(values, target));
      const result = evaluateSearching('jump', data, jump, () => 0);
      assert.equal(result.status, 'completed');
      assert.equal(result.correct, true);
      assert.equal(result.found, values.includes(target));
      assert.deepEqual(data.values, values);
      assert.deepEqual(jump(data), jump(data));
    }
  }
});

test('Jump Search counts block-end and linear probes including repeated endpoints', () => {
  const values = Array.from({length: 9}, (_, i) => i);
  assert.deepEqual(jump(input(values, 0)), {index: 0, probes: [2, 0], comparisons: 2});
  assert.deepEqual(jump(input(values, 2)), {index: 2, probes: [2, 0, 1, 2], comparisons: 4});
  assert.deepEqual(jump(input(values, 3)), {index: 3, probes: [2, 5, 3], comparisons: 3});
  assert.deepEqual(jump(input(values, 8)), {index: 8, probes: [2, 5, 8, 6, 7, 8], comparisons: 6});
  assert.deepEqual(jump(input(values, 9)), {index: null, probes: [2, 5, 8], comparisons: 3});
  assert.deepEqual(jump(input([...values, 9], 9)), {index: 9, probes: [2, 5, 8, 9, 9], comparisons: 5});
  assert.deepEqual(jump(input([], 0)), {index: null, probes: [], comparisons: 0});
});

test('Jump Search uses common preconditions and agrees with Linear/Binary on large inputs', () => {
  const entries = [
    {algorithm: 'linear', search: linear}, {algorithm: 'binary', search: binary}, {algorithm: 'jump', search: jump},
  ];
  const data = input([3, 1, 2], 1);
  const rejected = compareSearching(data, entries, () => 0);
  assert.equal(rejected[0].correct, true);
  assert.deepEqual(rejected.slice(1).map(row => row.error), ['requires_sorted_input', 'requires_sorted_input']);
  assert.deepEqual(data.values, [3, 1, 2]);
  const values = Array.from({length: MAX_SEARCHING_SIZE}, (_, i) => Math.floor(i / 3));
  for (const target of [-1, 0, 33, 34, 1666, 3333, 3334]) {
    const fresh = snapshotSearchingInput(input(values, target));
    const first = jump(fresh), expected = structuredClone(first);
    first.probes.length = 0;
    assert.deepEqual(jump(fresh), expected);
    assert.ok(compareSearching(fresh, entries, () => 0).every(result => result.correct));
    assert.deepEqual(fresh.values, values);
  }
});

const { exponential } = await import('../src/searching/exponential.ts');
test('Exponential Search covers bounds and agrees with the oracle without mutation', () => {
  for (const values of [[], [2], [1, 2], [1, 1, 1, 3], [-2, -1.5, 0, 2, 9],
    Array.from({length: MAX_SEARCHING_SIZE}, (_, i) => i)]) {
    for (const target of [-3, -1.5, 0, 1, 2, 3, 9, values.length - 1, MAX_SEARCHING_SIZE]) {
      const data = snapshotSearchingInput(input(values, target));
      const result = evaluateSearching('exponential', data, exponential, () => 0);
      assert.equal(result.correct, true);
      assert.equal(result.found, values.includes(target));
      assert.ok(result.probes.every(index => index >= 0 && index < values.length));
      assert.deepEqual(data.values, values);
      const first = exponential(data), expected = structuredClone(first);
      first.probes.length = 0;
      assert.deepEqual(exponential(data), expected);
    }
  }
});
test('Exponential Search records expansion/binary counters and uses common preconditions', () => {
  assert.deepEqual(exponential(input([0,1,2,3,4,5,6,7,8], 7)),
    {index: 7, probes: [0,1,2,4,8,6,7], comparisons: 8});
  assert.deepEqual(exponential(input([2], 2)), {index: 0, probes: [0], comparisons: 1});
  assert.deepEqual(exponential(input([], 2)), {index: null, probes: [], comparisons: 0});
  const entries = [{algorithm:'linear',search:linear},{algorithm:'binary',search:binary},
    {algorithm:'jump',search:jump},{algorithm:'exponential',search:exponential}];
  assert.ok(compareSearching(input([0,1,2,3], 3),entries,()=>0).every(row=>row.correct));
  const rows=compareSearching(input([3,1,2],1),entries,()=>0);
  assert.equal(rows[0].correct,true);
  assert.ok(rows.slice(1).every(row=>row.error==='requires_sorted_input'));
});

const { searchingAnimation, searchingPlayback, emptySearchingPlayback } = await import('../src/searching/visualization.ts');
const { SEARCHING_REGISTRY } = await import('../src/searching/registry.ts');
test('visualization observes the real implementations without changing their results', () => {
  for(const [algorithm, search] of Object.entries(SEARCHING_REGISTRY)) {
    for(const data of [input([],1),input([1],1),input([1,3,5,7,9,11,13,15],11),input([1,2,2,3],8)]) {
      const animation=searchingAnimation(algorithm,data), expected=search(data);
      assert.deepEqual(animation.frames.slice(1,-1).map(frame=>frame.probe),expected.probes);
      assert.equal(animation.index,expected.index);
      assert.deepEqual(search(data,()=>{}),expected);
      assert.deepEqual(searchingAnimation(algorithm,data),animation);
      assert.ok(Object.isFrozen(animation.input.values)&&Object.isFrozen(animation.frames));
      for(const frame of animation.frames.slice(1,-1)) {
        assert.ok(frame.low<=frame.probe&&frame.probe<=frame.high&&frame.high<data.values.length);
      }
    }
  }
});
test('visualization shows midpoint narrowing, jump blocks and exponential phases', () => {
  const data=input([0,1,2,3,4,5,6,7,8],7);
  assert.deepEqual(searchingAnimation('linear',data).frames.slice(1,-1).map(x=>x.probe),[0,1,2,3,4,5,6,7]);
  assert.deepEqual(searchingAnimation('binary',data).frames.slice(1,-1).map(x=>[x.low,x.high,x.probe]),[[0,8,4],[5,8,6],[7,8,7]]);
  assert.deepEqual(searchingAnimation('jump',data).frames.slice(1,-1).map(x=>x.phase),['jump','jump','jump','scan','scan']);
  assert.deepEqual(searchingAnimation('exponential',data).frames.slice(1,-1).map(x=>x.phase),['expand','expand','expand','expand','expand','binary','binary']);
  assert.throws(()=>searchingAnimation('binary',input([3,1,2],1)),/requires_sorted_input/);
  assert.throws(()=>searchingAnimation('linear',input(Array(65).fill(1),1)),/invalid_searching_input/);
});
test('playback stops at completion and clear/reset/new run remove old playback state', () => {
  const animation=searchingAnimation('linear',input([1,2],2));
  let state=searchingPlayback(emptySearchingPlayback,{type:'load',animation});
  state=searchingPlayback(state,{type:'play'});
  assert.equal(searchingPlayback(state,{type:'step'}),state);
  state=searchingPlayback(state,{type:'tick'});
  state=searchingPlayback(state,{type:'pause'});
  assert.equal(searchingPlayback(state,{type:'tick'}),state);
  state=searchingPlayback(state,{type:'step'});
  assert.equal(state.index,2);
  state=searchingPlayback(state,{type:'play'});
  for(let i=0;i<10;i++)state=searchingPlayback(state,{type:'tick'});
  assert.equal(state.index,animation.frames.length-1);
  assert.equal(state.playing,false);
  assert.deepEqual(searchingPlayback(state,{type:'reset'}),{animation,index:0,playing:false});
  assert.deepEqual(searchingPlayback(state,{type:'clear'}),emptySearchingPlayback);
  assert.deepEqual(searchingPlayback(state,{type:'load',animation}),{animation,index:0,playing:false});
});
test('searching UI parser validates numeric data, empty arrays and visualization limits', () => {
  assert.deepEqual(parseSearchingInput('1, -2.5 3','0'),input([1,-2.5,3],0));
  assert.deepEqual(parseSearchingInput('','2'),input([],2));
  for(const [values,target] of [['1',''],['NaN','1'],['Infinity','2'],['1','x']])assert.throws(()=>parseSearchingInput(values,target));
  assert.throws(()=>parseSearchingInput(Array(65).fill(1).join(','),'1',64));
});

const { parseSearchingInput } = await import('../src/searching/input.ts');

const { runSearchingComparison } = await import('../src/searching/comparison.ts');
test('UI comparison runs all four algorithms on the same numeric input and target', () => {
  const result=runSearchingComparison('1, 3, 5, 7, 9, 11','11',SEARCHING_ALGORITHMS);
  assert.deepEqual(result.input,input([1,3,5,7,9,11],11));
  assert.equal(result.rows.length,4);
  for(const row of result.rows) {
    assert.equal(row.status,'completed'); assert.equal(row.found,true);
    assert.equal(row.correct,true); assert.equal(row.index,5);
    assert.equal(row.probeCount,row.probes.length);
    assert.ok(row.comparisons>=row.probeCount);
    assert.ok(Number.isFinite(row.executionTimeMs)&&row.executionTimeMs>=0);
  }
  assert.ok(Object.isFrozen(result.input.values));
});
test('UI comparison distinguishes not-found, empty input and original zero index', () => {
  for(const values of ['','1, 3, 5']) {
    const result=runSearchingComparison(values,'2',SEARCHING_ALGORITHMS);
    for(const row of result.rows) {
      assert.equal(row.status,'completed'); assert.equal(row.found,false);
      assert.equal(row.index,null); assert.equal(row.correct,true);
      if(!values)assert.equal(row.probeCount,0);
    }
  }
  for(const row of runSearchingComparison('4','4',SEARCHING_ALGORITHMS).rows)assert.equal(row.index,0);
});
test('UI comparison keeps successful Linear row alongside three unsorted errors', () => {
  const result=runSearchingComparison('3, 1, 2','2',SEARCHING_ALGORITHMS);
  assert.deepEqual(result.input.values,[3,1,2]);
  assert.equal(result.rows[0].index,2); assert.equal(result.rows[0].correct,true);
  for(const row of result.rows.slice(1)) {
    assert.equal(row.status,'error'); assert.equal(row.error,'requires_sorted_input');
    for(const key of ['executionTimeMs','probeCount','comparisons','index','correct'])assert.equal(key in row,false);
  }
});
test('UI comparison rejects invalid numeric inputs and selections before running', () => {
  for(const selection of [[],['linear'],['linear','linear'],['linear','missing'],[...SEARCHING_ALGORITHMS,'linear']]) {
    assert.throws(()=>runSearchingComparison('1','1',selection),/invalid_selection/);
  }
  for(const [values,target] of [['1',''],['NaN','1'],['1','Infinity'],[Array(10001).fill(1).join(','),'1']]) {
    assert.throws(()=>runSearchingComparison(values,target,['linear','binary']),/invalid_searching_input/);
  }
});
