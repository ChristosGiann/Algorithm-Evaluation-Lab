export type SaveState =
  | {status:"idle" | "saving" | "error"; id:null}
  | {status:"saved"; id:number};
export type SaveOperation = (signal: AbortSignal) => Promise<{id:number}>;

/** One request per mounted snapshot. Adapters retain their own payload and timeout. */
export function createSaveController() {
  let state: SaveState = {status:"idle", id:null};
  let active: AbortController | null = null;
  const listeners = new Set<() => void>();
  function publish(next: SaveState) {
    state = next;
    listeners.forEach(listener => listener());
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    cancel() {
      active?.abort();
      active = null;
      // Silent disposal avoids updates on unmount; StrictMode setup may reuse the controller.
      if (state.status === "saving") state = {status:"idle", id:null};
    },
    async save(operation: SaveOperation, timeoutMs: number) {
      if (active || state.status === "saved") return;
      const controller = new AbortController();
      active = controller;
      publish({status:"saving", id:null});
      try {
        const response = await operation(AbortSignal.any([controller.signal, AbortSignal.timeout(timeoutMs)]));
        if (active === controller && !controller.signal.aborted) publish({status:"saved", id:response.id});
      } catch {
        if (active === controller && !controller.signal.aborted) publish({status:"error", id:null});
      } finally {
        if (active === controller) active = null;
      }
    },
  };
}
