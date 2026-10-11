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


const { createSaveController } = await import('../src/evaluation/saveController.ts');

test('shared save prevents duplicate requests and preserves the saved identity', async () => {
  const save = createSaveController();
  let resolve, calls=0;
  const operation = () => { calls++; return new Promise(done => {resolve=done;}); };
  const pending = save.save(operation, 1000);
  assert.equal(save.getSnapshot().status, 'saving');
  await save.save(operation, 1000);
  assert.equal(calls,1);
  resolve({id:95});
  await pending;
  assert.deepEqual(save.getSnapshot(),{status:'saved',id:95});
  await save.save(operation,1000);
  assert.equal(calls,1);
});

test('shared save supports retry after failure and aborts timeout requests', async () => {
  const save = createSaveController();
  const states=[];
  const unsubscribe=save.subscribe(()=>states.push(save.getSnapshot().status));
  await save.save(async ()=>{throw new Error('network');},1000);
  assert.equal(save.getSnapshot().status,'error');
  // Keep the event loop alive while AbortSignal.timeout's unref timer fires.
  const keepAlive=setTimeout(()=>{},1000);
  try {
    await save.save(signal=>new Promise((resolve,reject)=>{
      signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
    }),5);
  } finally {clearTimeout(keepAlive);}
  assert.equal(save.getSnapshot().status,'error');
  await save.save(async ()=>({id:7}),1000);
  assert.deepEqual(states,['saving','error','saving','error','saving','saved']);
  unsubscribe();
});

test('cancelled saves cannot publish late results or unlock a newer request', async () => {
  const save=createSaveController();
  let resolveOld, resolveNew, oldSignal;
  const old=save.save(signal=>{oldSignal=signal;return new Promise(resolve=>{resolveOld=resolve;});},1000);
  save.cancel();
  assert.equal(oldSignal.aborted,true);
  const current=save.save(()=>new Promise(resolve=>{resolveNew=resolve;}),1000);
  resolveOld({id:1}); await old;
  assert.equal(save.getSnapshot().status,'saving');
  let extraCalls=0;
  await save.save(async()=>{extraCalls++;return {id:3};},1000);
  assert.equal(extraCalls,0);
  resolveNew({id:2}); await current;
  assert.deepEqual(save.getSnapshot(),{status:'saved',id:2});
});

test('shared persisted envelopes keep sorting and pathfinding metrics distinct at compile time', () => {
  const program=ts.createProgram(['tests/type-contracts.ts'], {
    noEmit:true, strict:true, skipLibCheck:true, target:ts.ScriptTarget.ES2023,
    module:ts.ModuleKind.ESNext, moduleResolution:ts.ModuleResolutionKind.Bundler,
  });
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{
    getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n',
  }));
});
