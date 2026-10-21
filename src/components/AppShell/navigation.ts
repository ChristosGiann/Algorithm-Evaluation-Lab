export const WORKSPACES = ["overview", "sorting", "pathfinding", "searching", "strings", "experiments", "library"] as const;
export type Workspace = typeof WORKSPACES[number];
export function workspaceFromHash(hash: string): Workspace {
  const value = hash.replace(/^#/, "");
  return WORKSPACES.find(key => key === value) ?? "overview";
}
export type NavigationState = { active: Workspace; visited: Workspace[] };
export function navigate(state: NavigationState, active: Workspace): NavigationState {
  if (active === state.active) return state;
  return { active, visited: state.visited.includes(active) ? state.visited : [...state.visited, active] };
}
