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

const { naive } = await import('../src/stringSearch/naive.ts');
test('Naive String Search returns literal first match with exact alignments and comparisons',()=>{
  for(const [text,pattern,index,alignments,comparisons] of [
    ['', '', 0, [0], 0], ['abc', '', 0, [0], 0], ['', 'a', null, [], 0],
    ['a', 'aa', null, [], 0], ['abc', 'abc', 0, [0], 3], ['xxabczz', 'abc', 2, [0,1,2], 5],
    ['xxabc', 'abc', 2, [0,1,2], 5], ['abc', 'z', null, [0,1,2], 3],
    ['banana', 'ana', 1, [0,1], 4], ['aaaaa', 'aaa', 0, [0], 3],
    ['aaaaab', 'aaab', 2, [0,1,2], 12], ['ababab', 'abab', 0, [0], 4],
    ['ABC', 'abc', null, [0], 1], ['aA', 'A', 1, [0,1], 2],
    ['😀a😀', 'a', 2, [0,1,2], 3], ['😀', String.fromCharCode(0xde00), 1, [0,1], 2],
    ['e'+String.fromCharCode(0x301), 'é', null, [0,1], 2], ['a'+String.fromCharCode(0)+'b', String.fromCharCode(0), 1, [0,1], 2],
  ]) {
    const prepared=naive(pattern);
    assert.equal(prepared.comparisons,0);
    assert.deepEqual(prepared.search(text),{index,alignments,comparisons},JSON.stringify({text,pattern}));
    const data=Object.freeze(input(text,pattern));
    const result=evaluateStringSearch('naive',data,naive,()=>0);
    assert.equal(result.status,'completed'); assert.equal(result.correct,true);
    assert.equal(result.index,index); assert.equal(result.found,index!==null);
    assert.deepEqual(result.occurrenceIndexes,index===null?[]:[index]);
    assert.deepEqual(data,input(text,pattern));
  }
});

test('Naive exhaustive short strings agree with independent native first-match oracle',()=>{
  function strings(length) {
    return length===0?['']:strings(length-1).flatMap(prefix=>['a','b'].map(letter=>prefix+letter));
  }
  const texts=Array.from({length:7},(_,i)=>strings(i)).flat();
  const patterns=Array.from({length:5},(_,i)=>strings(i)).flat();
  for(const text of texts)for(const pattern of patterns) {
    const result=naive(pattern).search(text);
    const expected=text.indexOf(pattern);
    assert.equal(result.index,expected===-1?null:expected,JSON.stringify({text,pattern}));
    const last=expected===-1?text.length-pattern.length:expected;
    assert.deepEqual(result.alignments,Array.from({length:Math.max(0,last+1)},(_,i)=>i));
    assert.ok(Number.isSafeInteger(result.comparisons)&&result.comparisons>=0);
    assert.ok(result.comparisons<=result.alignments.length*pattern.length);
  }
});

test('Naive prepared searches and evaluation runs have independent mutable traces',()=>{
  const prepared=naive('ana');
  const first=prepared.search('banana');
  const expected=structuredClone(first);
  first.alignments.push(99);
  assert.deepEqual(prepared.search(''),{index:null,alignments:[],comparisons:0});
  assert.deepEqual(prepared.search('banana'),expected);
  assert.deepEqual(naive('ana').search('banana'),expected);
  const result=evaluateStringSearch('naive',input(),naive,()=>0);
  assert.ok(Object.isFrozen(result.alignments));
  assert.ok(Object.isFrozen(result.occurrenceIndexes));
  assert.deepEqual(result.alignments,[0,1]);
});

test('Naive uses shared comparison and separate phase timing without fabricated preprocessing duration',()=>{
  const ticks=[1,3,10,15];
  const source=input();
  const rows=compareStringSearch(source,[{algorithm:'naive',prepare:naive}],()=>ticks.shift());
  assert.equal(rows.length,1);
  assert.equal(rows[0].correct,true);
  assert.equal(rows[0].preprocessingComparisons,0);
  assert.equal(rows[0].preprocessingTimeMs,2);
  assert.equal(rows[0].executionTimeMs,5);
  assert.equal(rows[0].comparisons,4);
  assert.deepEqual(source,input());
  const mixed=compareStringSearch(source,[
    {algorithm:'kmp',prepare(){throw new Error('test failure');}},
    {algorithm:'naive',prepare:naive},
  ],()=>0);
  assert.equal(mixed[0].error,'preprocessing_error');
  assert.equal(mixed[1].correct,true);
});

test('Naive maximum-size repeated-prefix regression uses counters instead of timing thresholds',()=>{
  const pattern='a'.repeat(MAX_PATTERN_LENGTH-1)+'b';
  for(const [text,index] of [
    ['a'.repeat(MAX_TEXT_LENGTH),null],
    ['a'.repeat(MAX_TEXT_LENGTH-1)+'b',MAX_TEXT_LENGTH-MAX_PATTERN_LENGTH],
  ]) {
    const result=evaluateStringSearch('naive',input(text,pattern),naive,()=>0);
    assert.equal(result.status,'completed');assert.equal(result.correct,true);
    assert.equal(result.index,index);
    assert.equal(result.alignments.length,MAX_TEXT_LENGTH-MAX_PATTERN_LENGTH+1);
    assert.equal(result.comparisons,(MAX_TEXT_LENGTH-MAX_PATTERN_LENGTH+1)*MAX_PATTERN_LENGTH);
    assert.equal(result.alignments.at(-1),MAX_TEXT_LENGTH-MAX_PATTERN_LENGTH);
  }
});

const { kmp, buildLps } = await import('../src/stringSearch/kmp.ts');
test('KMP LPS is deterministic, immutable and counts prefix comparisons',()=>{
  assert.deepEqual(buildLps('ababaca'),{table:[0,0,1,2,3,0,1],comparisons:8});
  assert.deepEqual(buildLps('aaaa'),{table:[0,1,2,3],comparisons:3});
  assert.deepEqual(buildLps(''),{table:[],comparisons:0});
  assert.ok(Object.isFrozen(buildLps('ababaca').table));
});
test('KMP first-match, fallback, boundaries and repeated runs use common evaluation',()=>{
  for(const [text,pattern] of [['',''],['','a'],['abc',''],['a','aa'],['banana','ana'],['abababacaba','ababaca'],['aaaaab','aaab'],['ABC','abc'],['xxabc','abc'],['abc','x'],['😀a😀','a']]) {
    const source=Object.freeze(input(text,pattern));
    const result=evaluateStringSearch('kmp',source,kmp,()=>0);
    assert.equal(result.correct,true,JSON.stringify(source));
    const expected=text.indexOf(pattern);
    assert.equal(result.index,expected<0?null:expected);
    assert.deepEqual(source,input(text,pattern));
    const prepared=kmp(pattern), first=prepared.search(text), copy=structuredClone(first);
    first.alignments.push(-1); prepared.search('');
    assert.deepEqual(prepared.search(text),copy);
  }
  assert.deepEqual(kmp('aaab').search('aaaaab'),{index:2,alignments:[0,1,2],comparisons:8});
  const rows=compareStringSearch(input('aaaaab','aaab'),[{algorithm:'naive',prepare:naive},{algorithm:'kmp',prepare:kmp}],()=>0);
  assert.ok(rows.every(row=>row.correct));
  assert.equal(rows[1].preprocessingComparisons,5);
});
test('KMP deterministic generated and long repeated-prefix inputs match an independent oracle',()=>{
  for(let size=0;size<100;size++)for(const pattern of ['','a','b','aba','ababac','aaaaab']) {
    const text='ab'.repeat(size)+'ac'+'a'.repeat(size)+'b';
    assert.equal(evaluateStringSearch('kmp',input(text,pattern),kmp,()=>0).correct,true);
  }
  const text='a'.repeat(9999)+'b', pattern='a'.repeat(999)+'b';
  const result=evaluateStringSearch('kmp',input(text,pattern),kmp,()=>0);
  assert.equal(result.index,9000); assert.equal(result.correct,true);
  assert.ok(result.comparisons<=2*text.length);
  assert.ok(result.preprocessingComparisons<=2*pattern.length);
});

const { rabinKarp, HASH_BASE, HASH_MODULUS } = await import('../src/stringSearch/rabinKarp.ts');
test('Rabin-Karp verifies constructed hash collisions before accepting a match',()=>{
  const collision=String.fromCharCode(0,257), pattern=String.fromCharCode(1,0);
  const hash=value=>[...value].reduce((h,c)=>(h*HASH_BASE+c.charCodeAt(0)+1)%HASH_MODULUS,0);
  assert.equal(hash(collision),hash(pattern)); assert.notEqual(collision,pattern);
  assert.deepEqual(rabinKarp(pattern).search(collision),{index:null,alignments:[0],comparisons:1});
  const text=collision+'xx'+pattern;
  const result=evaluateStringSearch('rabinKarp',input(text,pattern),rabinKarp,()=>0);
  assert.equal(result.index,4); assert.equal(result.correct,true); assert.equal(result.comparisons,3);
});
test('Rabin-Karp edge cases and deterministic windows agree with the first-match oracle',()=>{
  for(const [text,pattern] of [['',''],['abc',''],['','a'],['a','aa'],['banana','ana'],['aaaaab','aaab'],['ABC','abc'],['xxabc','abc'],['abc','z'],['😀a😀','a']]) {
    const data=Object.freeze(input(text,pattern));
    const result=evaluateStringSearch('rabinKarp',data,rabinKarp,()=>0);
    assert.equal(result.correct,true,JSON.stringify(data)); assert.equal(result.preprocessingComparisons,0);
    const expected=text.indexOf(pattern), last=expected<0?text.length-pattern.length:expected;
    assert.deepEqual(result.alignments,Array.from({length:Math.max(0,last+1)},(_,i)=>i));
    const prepared=rabinKarp(pattern), first=prepared.search(text), copy=structuredClone(first);
    first.alignments.push(-1); prepared.search('');
    assert.deepEqual(prepared.search(text),copy); assert.deepEqual(data,input(text,pattern));
  }
  assert.deepEqual(rabinKarp('ana').search('banana'),{index:1,alignments:[0,1],comparisons:3});
  assert.deepEqual(rabinKarp('z').search('abc'),{index:null,alignments:[0,1,2],comparisons:0});
});
test('Rabin-Karp rolling arithmetic works on generated/high code units and maximum input',()=>{
  for(let size=0;size<120;size++) {
    const text=Array.from({length:size},(_,i)=>String.fromCharCode((i*7919+size*17)%65536)).join('');
    for(const pattern of ['',text.slice(0,3),text.slice(-4),'absent'])assert.equal(evaluateStringSearch('rabinKarp',input(text,pattern),rabinKarp,()=>0).correct,true);
  }
  const data=input('a'.repeat(9999)+'b','a'.repeat(999)+'b');
  const rows=compareStringSearch(data,[{algorithm:'naive',prepare:naive},{algorithm:'kmp',prepare:kmp},{algorithm:'rabinKarp',prepare:rabinKarp}],()=>0);
  assert.ok(rows.every(row=>row.correct&&row.index===9000));
});

const { boyerMoore } = await import('../src/stringSearch/boyerMoore.ts');
test('Boyer-Moore bad-character shifts and right-to-left counts are deterministic',()=>{
  for(const [text,pattern,index,alignments,comparisons] of [
    ['','',0,[0],0],['abc','',0,[0],0],['','a',null,[],0],['a','aa',null,[],0],
    ['xxabc','abc',2,[0,2],4],['abcdef','xyz',null,[0,3],2],
    ['banana','ana',1,[0,1],4],['aaaaab','aaab',2,[0,1,2],6],['aaaaa','aaa',0,[0],3],
    ['ABAAABCD','ABC',4,[0,2,4],5],
  ])assert.deepEqual(boyerMoore(pattern).search(text),{index,alignments,comparisons},JSON.stringify({text,pattern}));
});
test('Boyer-Moore boundaries, UTF-16 and repeated-run isolation match native oracle',()=>{
  const fixtures=[['ABC','abc'],['😀a😀','a'],['ababab','abab'],['abc','c'],['abcd','ab'],['abcd','bc']];
  for(let size=0;size<150;size++)fixtures.push(['ab'.repeat(size)+'aabc','aabc']);
  for(const [text,pattern] of fixtures) {
    const source=Object.freeze(input(text,pattern));
    const result=evaluateStringSearch('boyerMoore',source,boyerMoore,()=>0);
    assert.equal(result.correct,true,JSON.stringify(source)); assert.equal(result.preprocessingComparisons,0);
    const prepared=boyerMoore(pattern), first=prepared.search(text), copy=structuredClone(first);
    first.alignments.push(-1); prepared.search(''); assert.deepEqual(prepared.search(text),copy);
    assert.deepEqual(source,input(text,pattern));
  }
});
test('Boyer-Moore joins all four real algorithms on long deterministic inputs',()=>{
  for(const pattern of ['a'.repeat(999)+'b','b'+'a'.repeat(999)]) {
    const rows=compareStringSearch(input('a'.repeat(9999)+'b',pattern),[
      {algorithm:'naive',prepare:naive},{algorithm:'kmp',prepare:kmp},
      {algorithm:'rabinKarp',prepare:rabinKarp},{algorithm:'boyerMoore',prepare:boyerMoore},
    ],()=>0);
    assert.ok(rows.every(row=>row.correct));
    for(const row of rows)assert.ok(row.alignments.every(offset=>offset>=0&&offset<=9000));
  }
});

const { STRING_SEARCH_REGISTRY }=await import('../src/stringSearch/registry.ts');
const { stringSearchAnimation, stringSearchPlayback, emptyStringSearchPlayback, codeUnitLabel }=await import('../src/stringSearch/visualization.ts');
test('string-search visualization observes real comparisons without changing measured traces',()=>{
  for(const [algorithm,prepare] of Object.entries(STRING_SEARCH_REGISTRY))for(const [text,pattern] of [['banana','ana'],['aaaaab','aaab'],['abc','z'],['',''],['a','abc']]) {
    const prepared=prepare(pattern),steps=[];
    const observed=prepared.search(text,step=>steps.push(step));
    assert.deepEqual(observed,prepared.search(text));
    assert.equal(steps.filter(step=>step.phase==='compare').length,observed.comparisons);
    for(const step of steps.filter(step=>step.phase==='compare')) {
      assert.equal(step.equal,text[step.textIndex]===pattern[step.patternIndex]);
      assert.equal(step.textIndex,step.offset+step.patternIndex);
    }
    const animation=stringSearchAnimation(algorithm,input(text,pattern));
    assert.equal(animation.index,observed.index);
    assert.deepEqual(animation.frames.slice(1,-1),steps);
    assert.deepEqual(animation,stringSearchAnimation(algorithm,input(text,pattern)));
    assert.ok(Object.isFrozen(animation.frames)&&Object.isFrozen(animation.input));
    assert.ok(animation.frames.every(frame=>Object.isFrozen(frame)));
    assert.ok(!('executionTimeMs' in animation));
  }
});
test('string-search visualization exposes KMP fallback, RK windows and right-to-left BM shifts',()=>{
  const k=stringSearchAnimation('kmp',input('aaaaab','aaab'));
  assert.deepEqual(k.frames.filter(f=>f.phase==='fallback').map(f=>[f.nextOffset,f.matched]),[[1,2],[2,2]]);
  const r=stringSearchAnimation('rabinKarp',input('banana','ana'));
  assert.deepEqual(r.frames.filter(f=>f.phase==='hash').map(f=>[f.offset,f.equal]),[[0,false],[1,true]]);
  const b=stringSearchAnimation('boyerMoore',input('xxabc','abc'));
  assert.deepEqual(b.frames.filter(f=>f.phase==='compare').map(f=>f.patternIndex),[2,2,1,0]);
  assert.equal(b.frames.find(f=>f.phase==='shift').nextOffset,2);
  assert.throws(()=>stringSearchAnimation('naive',input('x'.repeat(65),'a')));
  assert.throws(()=>stringSearchAnimation('naive',input('a','x'.repeat(17))));
  assert.equal(codeUnitLabel(' '),'U+0020');
  assert.equal(codeUnitLabel(String.fromCharCode(0xde00)),'U+DE00');
});
test('string-search playback resets, pauses, completes and clears stale frames',()=>{
  const animation=stringSearchAnimation('naive',input());
  let state=stringSearchPlayback(emptyStringSearchPlayback,{type:'load',animation});
  state=stringSearchPlayback(state,{type:'play'});
  assert.equal(stringSearchPlayback(state,{type:'step'}),state);
  state=stringSearchPlayback(state,{type:'tick'});
  state=stringSearchPlayback(state,{type:'pause'});
  assert.equal(stringSearchPlayback(state,{type:'tick'}),state);
  state=stringSearchPlayback(state,{type:'step'}); assert.equal(state.index,2);
  state=stringSearchPlayback(state,{type:'play'});
  for(let i=0;i<30;i++)state=stringSearchPlayback(state,{type:'tick'});
  assert.equal(state.index,animation.frames.length-1);assert.equal(state.playing,false);
  assert.deepEqual(stringSearchPlayback(state,{type:'reset'}),{animation,index:0,playing:false});
  assert.deepEqual(stringSearchPlayback(state,{type:'clear'}),emptyStringSearchPlayback);
  assert.deepEqual(stringSearchPlayback(state,{type:'load',animation}),{animation,index:0,playing:false});
});

const { runStringSearchComparison } = await import('../src/stringSearch/comparison.ts');
test('string comparison preserves literal input, ordered selection and first/absent/empty results', () => {
  for (const [text, pattern, expected] of [['aaaaab','aaab',2],['abc','z',null],['','',0],[' a ',' ',0],['A','a',null]]) {
    const result = runStringSearchComparison(text,pattern,['boyerMoore','kmp','naive','rabinKarp']);
    assert.equal(result.input.text,text); assert.equal(result.input.pattern,pattern);
    assert.deepEqual(result.rows.map(row=>row.algorithm),['boyerMoore','kmp','naive','rabinKarp']);
    for (const row of result.rows) {assert.equal(row.index,expected);assert.equal(row.correct,true);}
  }
  for (const selected of [[],['naive'],['naive','naive'],['naive','unknown']]) assert.throws(()=>runStringSearchComparison('a','a',selected),/invalid_selection/);
});
