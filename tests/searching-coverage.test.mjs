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


const { SEARCHING_REGISTRY } = await import('../src/searching/registry.ts');
const { evaluateSearching, compareSearching, MAX_SEARCHING_SIZE, MAX_SEARCHING_PROBES } = await import('../src/searching/evaluation.ts');
const algorithms=Object.keys(SEARCHING_REGISTRY);

// Independent oracle: collect every matching original index, accepting any duplicate.
function matches(values,target) {
  return values.flatMap((value,index)=>value===target ? [index] : []);
}
function verify(algorithm,values,target) {
  const source={values:[...values],target};
  const original=structuredClone(source);
  const observed=[];
  const direct=SEARCHING_REGISTRY[algorithm](Object.freeze({...source,values:Object.freeze([...values])}),event=>observed.push(event));
  const expected=matches(values,target);
  assert.equal(direct.index===null,expected.length===0,`${algorithm}: ${JSON.stringify(source)}`);
  if(expected.length)assert.ok(expected.includes(direct.index));
  assert.deepEqual(observed.map(event=>event.probe),direct.probes);
  for(const event of observed) {
    assert.ok(Number.isInteger(event.probe)&&event.probe>=0&&event.probe<values.length);
    assert.ok(event.low>=0&&event.low<=event.probe&&event.high>=event.probe&&event.high<values.length);
  }
  assert.ok(Number.isSafeInteger(direct.comparisons)&&direct.comparisons>=direct.probes.length);
  let tick=0;
  const measured=evaluateSearching(algorithm,source,SEARCHING_REGISTRY[algorithm],()=>tick++);
  assert.equal(measured.status,'completed');
  assert.equal(measured.correct,true);
  assert.equal(measured.found,expected.length>0);
  assert.equal(measured.index,direct.index);
  assert.equal(measured.probeCount,direct.probes.length);
  assert.equal(measured.comparisons,direct.comparisons);
  assert.deepEqual(measured.probes,direct.probes);
  assert.equal(measured.executionTimeMs,1);
  assert.deepEqual(source,original);
  return direct;
}

// Exhaustive bounded small arrays exercise duplicates and every short ordering.
function smallArrays(length,prefix=[]) {
  if(!length)return [prefix];
  return [-1,0,1].flatMap(value=>smallArrays(length-1,[...prefix,value]));
}
const exhaustive=Array.from({length:6},(_,length)=>smallArrays(length)).flat();
// Fixed seed: no Math.random and no wall-time assertions in this suite.
let seed=0x121122;
function random() {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;}
const generated=Array.from({length:48},(_,i)=>Array.from({length:7+i*3},()=>((random()%101)-50)/4));
const edges=[[],[0],[1,1,1],[-Number.MAX_VALUE,-Number.MIN_VALUE,-0,0,Number.MIN_VALUE,Number.MAX_VALUE]];
for(const algorithm of algorithms) {
  test(`${algorithm}: exhaustive/seeded oracle matrix, immutable inputs and valid observer traces`,()=>{
    const datasets=[...edges,...exhaustive,...generated].map(values=>algorithm==='linear'?values:[...values].sort((a,b)=>a-b));
    for(const values of datasets) {
      const targets=new Set([-2,-1,0,0.5,1,2,values[0],values[Math.floor(values.length/2)],values.at(-1)]);
      for(const target of targets)if(target!==undefined)verify(algorithm,values,target);
    }
  });
}

test('all implementations handle the 10,000 item boundary and isolate repeated result traces',()=>{
  const datasets=[Array.from({length:MAX_SEARCHING_SIZE},(_,i)=>i*2),Array(MAX_SEARCHING_SIZE).fill(7)];
  for(const algorithm of algorithms)for(const values of datasets) {
    for(const target of [-1,values[0],values[5000],values.at(-1),values.at(-1)+1]) {
      const first=verify(algorithm,values,target);
      const expected=structuredClone(first);
      first.probes.push(-999);
      verify(algorithm,[],target);
      const again=verify(algorithm,values,target);
      assert.deepEqual(again,expected);
      assert.notEqual(first.probes,again.probes);
    }
  }
});

test('counter fixtures count repeated probes and failed binary equality checks exactly',()=>{
  const values=[0,2,4,6,8,10,12,14,16];
  const fixtures={linear:[[0,1,2,3,4,5,6,7],8],binary:[[4,6,7],5],jump:[[2,5,8,6,7],5],exponential:[[0,1,2,4,8,6,7],8]};
  for(const algorithm of algorithms) {
    const result=verify(algorithm,values,14);
    assert.deepEqual([result.probes,result.comparisons],fixtures[algorithm]);
  }
  const repeated=verify('jump',[3],3);
  assert.deepEqual(repeated,{index:0,probes:[0,0],comparisons:2});
});

test('unsorted matrix is rejected before clock/runner and comparison preserves Linear results',()=>{
  const datasets=exhaustive.filter(values=>values.some((value,i)=>i>0&&values[i-1]>value));
  for(const values of datasets) {
    const source={values:[...values],target:0};
    for(const algorithm of algorithms.filter(a=>a!=='linear')) {
      const row=evaluateSearching(algorithm,source,()=>assert.fail('runner must not execute'),()=>assert.fail('clock must not execute'));
      assert.deepEqual(row,{algorithm,status:'error',error:'requires_sorted_input'});
    }
    const rows=compareSearching(source,algorithms.map(algorithm=>({algorithm,search:SEARCHING_REGISTRY[algorithm]})),()=>0);
    assert.equal(rows[0].correct,true);
    assert.equal(rows[0].found,matches(values,0).length>0);
    for(const row of rows.slice(1))assert.deepEqual(Object.keys(row).sort(),['algorithm','error','status']);
    assert.deepEqual(source.values,values);
  }
});

test('every algorithm identity rejects invalid traces while reporting well-formed wrong answers',()=>{
  for(const algorithm of algorithms) {
    const source={values:[1,2],target:2};
    const invalid=[null,{}, {index:true,probes:[0],comparisons:1}, {index:1,probes:[],comparisons:0},
      {index:null,probes:[-1],comparisons:1}, {index:null,probes:[2],comparisons:1},
      {index:null,probes:[0],comparisons:0}, {index:null,probes:[],comparisons:2**53},
      {index:null,probes:[],comparisons:0.5}, {index:null,probes:Array(MAX_SEARCHING_PROBES+1).fill(0),comparisons:MAX_SEARCHING_PROBES+1}];
    for(const trace of invalid)assert.deepEqual(evaluateSearching(algorithm,source,()=>trace,()=>0),{algorithm,status:'error',error:'invalid_result'});
    for(const trace of [{index:null,probes:[0,1],comparisons:2},{index:0,probes:[0],comparisons:1}]) {
      const result=evaluateSearching(algorithm,source,()=>trace,()=>0);
      assert.equal(result.status,'completed');assert.equal(result.correct,false);
    }
  }
});
