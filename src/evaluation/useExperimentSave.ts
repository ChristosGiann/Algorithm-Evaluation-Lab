import { useEffect, useState, useSyncExternalStore } from "react";
import { createSaveController } from "./saveController";

export function useExperimentSave() {
  const [controller] = useState(createSaveController);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => () => controller.cancel(), [controller]);
  return {state, save:controller.save};
}
