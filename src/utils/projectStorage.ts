import { FloorPlanState } from '../types/floorplan';

export interface SavedProjectItem {
  id: string;
  name: string;
  savedAt: string; // ISO timestamp
  notes?: string;
  state: {
    projectName: string;
    plot: FloorPlanState['plot'];
    rooms: FloorPlanState['rooms'];
    openings: FloorPlanState['openings'];
    fixtures: FloorPlanState['fixtures'];
    metadata?: FloorPlanState['metadata'];
    activeCategory?: FloorPlanState['activeCategory'];
  };
}

const LIBRARY_KEY = 'taxis_saved_projects_library_v1';

export function getSavedProjectsLibrary(): SavedProjectItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse saved projects library', e);
    return [];
  }
}

export function saveProjectToLibrary(name: string, state: FloorPlanState, notes?: string): SavedProjectItem {
  const library = getSavedProjectsLibrary();
  const id = `project-${Date.now()}`;
  const newItem: SavedProjectItem = {
    id,
    name: name.trim() || state.projectName || 'Untitled Project',
    savedAt: new Date().toISOString(),
    notes,
    state: {
      projectName: name.trim() || state.projectName,
      plot: JSON.parse(JSON.stringify(state.plot)),
      rooms: JSON.parse(JSON.stringify(state.rooms)),
      openings: JSON.parse(JSON.stringify(state.openings)),
      fixtures: JSON.parse(JSON.stringify(state.fixtures)),
      metadata: state.metadata ? JSON.parse(JSON.stringify(state.metadata)) : undefined,
      activeCategory: state.activeCategory,
    },
  };

  // If a project with the same name exists, update it, otherwise prepend
  const existingIdx = library.findIndex((p) => p.name.toLowerCase() === newItem.name.toLowerCase());
  if (existingIdx >= 0) {
    library[existingIdx] = newItem;
  } else {
    library.unshift(newItem);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  }

  return newItem;
}

export function loadProjectFromLibrary(idOrName: string): SavedProjectItem | null {
  const library = getSavedProjectsLibrary();
  const q = idOrName.toLowerCase();
  return (
    library.find(
      (p) => p.id === idOrName || p.name.toLowerCase() === q || p.name.toLowerCase().includes(q)
    ) || null
  );
}

export function deleteProjectFromLibrary(idOrName: string): boolean {
  const library = getSavedProjectsLibrary();
  const q = idOrName.toLowerCase();
  const filtered = library.filter((p) => p.id !== idOrName && p.name.toLowerCase() !== q);
  if (filtered.length !== library.length) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(filtered));
    }
    return true;
  }
  return false;
}
