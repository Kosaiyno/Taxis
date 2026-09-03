import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Save,
  Trash2,
  Clock,
  ArrowRight,
  Plus,
  X,
  LandPlot,
  FileCheck,
} from 'lucide-react';
import { useFloorPlanStore } from '../../store/floorplanStore';
import {
  getSavedProjectsLibrary,
  saveProjectToLibrary,
  deleteProjectFromLibrary,
  SavedProjectItem,
} from '../../utils/projectStorage';

interface ProjectsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'save' | 'library';
}

export const ProjectsLibraryModal: React.FC<ProjectsLibraryModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'save',
}) => {
  const store = useFloorPlanStore();
  const { projectName, setProjectName, loadState } = store;

  const [mode, setMode] = useState<'save' | 'library'>(initialMode);
  const [saveName, setSaveName] = useState(projectName || 'My Custom Space');
  const [saveNotes, setSaveNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [library, setLibrary] = useState<SavedProjectItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSaveName(projectName || 'My Custom Space');
      setLibrary(getSavedProjectsLibrary());
      setSavedSuccess(false);
      setMode(initialMode);
    }
  }, [isOpen, projectName, initialMode]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!saveName.trim()) return;

    const trimmed = saveName.trim();
    setProjectName(trimmed);
    saveProjectToLibrary(trimmed, store, saveNotes);
    setLibrary(getSavedProjectsLibrary());
    setSavedSuccess(true);

    setTimeout(() => {
      setMode('library');
      setSavedSuccess(false);
    }, 1200);
  };

  const handleLoadProject = (item: SavedProjectItem) => {
    loadState({
      projectName: item.state.projectName,
      plot: item.state.plot,
      rooms: item.state.rooms,
      openings: item.state.openings,
      fixtures: item.state.fixtures,
      metadata: item.state.metadata,
      activeCategory: item.state.activeCategory,
      selectedId: null,
      selectedType: null,
    });
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProjectFromLibrary(id);
    setLibrary(getSavedProjectsLibrary());
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#18110e] border border-[#3d302a] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-[#e6ccb2] max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#1f1714] border-b border-[#3d302a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c99a6e]/15 border border-[#c99a6e]/30 flex items-center justify-center text-[#c99a6e]">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#f5ebe0]">Saved Layouts & Projects</h2>
              <p className="text-[10px] text-[#b08968]">Save and switch between your floor plan designs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#322723] text-[#8d7b68] hover:text-[#f5ebe0] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1.5 bg-[#140e0c] border-b border-[#3d302a] text-center gap-1">
          <button
            onClick={() => setMode('save')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              mode === 'save'
                ? 'bg-[#c99a6e] text-[#140e0c] shadow-md'
                : 'text-[#b08968] hover:text-[#f5ebe0] hover:bg-[#261e1b]'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Layout</span>
          </button>

          <button
            onClick={() => setMode('library')}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              mode === 'library'
                ? 'bg-[#c99a6e] text-[#140e0c] shadow-md'
                : 'text-[#b08968] hover:text-[#f5ebe0] hover:bg-[#261e1b]'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>My Layouts ({library.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {mode === 'save' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b08968] mb-1.5">
                  Layout / Project Name:
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Master Bedroom Villa, Keynote Expo Hall..."
                  required
                  autoFocus
                  className="w-full bg-[#261e1b] border border-[#3d302a] focus:border-[#c99a6e] rounded-2xl px-3.5 py-2.5 text-sm text-[#f5ebe0] font-semibold focus:outline-none transition shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#b08968] mb-1.5">
                  Notes / Description (Optional):
                </label>
                <textarea
                  rows={2}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="e.g. Added 2 bathrooms, enlarged living room window..."
                  className="w-full bg-[#261e1b] border border-[#3d302a] focus:border-[#c99a6e] rounded-2xl px-3.5 py-2 text-xs text-[#f5ebe0] focus:outline-none transition custom-scrollbar"
                />
              </div>

              {/* Current Metrics Summary */}
              <div className="p-3 bg-[#261e1b]/60 border border-[#3d302a] rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#b08968]">
                  Included in this Snapshot:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 bg-[#1c1512] rounded-xl border border-[#3d302a]">
                    <div className="font-extrabold text-[#c99a6e]">{store.rooms.length}</div>
                    <div className="text-[9px] text-[#8d7b68]">Rooms/Spaces</div>
                  </div>
                  <div className="p-2 bg-[#1c1512] rounded-xl border border-[#3d302a]">
                    <div className="font-extrabold text-[#c99a6e]">{store.openings.length}</div>
                    <div className="text-[9px] text-[#8d7b68]">Doors & Windows</div>
                  </div>
                  <div className="p-2 bg-[#1c1512] rounded-xl border border-[#3d302a]">
                    <div className="font-extrabold text-[#c99a6e]">{store.fixtures.length}</div>
                    <div className="text-[9px] text-[#8d7b68]">Objects & Shapes</div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savedSuccess || !saveName.trim()}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                  savedSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-[#c99a6e] hover:bg-[#b08968] text-[#18110e] shadow-[#c99a6e]/20 active:scale-98'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Saved to My Layouts!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Layout to Library</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {library.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#261e1b] border border-[#3d302a] flex items-center justify-center mx-auto text-[#8d7b68]">
                    <FolderArchive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#f5ebe0]">No Saved Layouts Yet</h3>
                    <p className="text-xs text-[#b08968] max-w-xs mx-auto mt-1">
                      Save your current floor plan to easily return to it anytime you want.
                    </p>
                  </div>
                  <button
                    onClick={() => setMode('save')}
                    className="py-2 px-4 bg-[#c99a6e] hover:bg-[#b08968] text-[#18110e] font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Current Plan</span>
                  </button>
                </div>
              ) : (
                library.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadProject(item)}
                    className="p-3.5 bg-[#261e1b]/70 hover:bg-[#322723] border border-[#3d302a] hover:border-[#c99a6e] rounded-2xl transition group cursor-pointer shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#f5ebe0] group-hover:text-[#c99a6e] transition-colors truncate">
                          {item.name}
                        </h4>
                        <span className="text-[9px] font-mono bg-[#1c1512] px-2 py-0.5 rounded-full text-[#8d7b68] border border-[#3d302a] shrink-0">
                          {item.state.rooms.length} Spaces
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[10px] text-[#b08968] truncate mt-0.5 italic">
                          {item.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-[#8d7b68] font-mono mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#b08968]" />
                          <span>{formatDate(item.savedAt)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <LandPlot className="w-3 h-3 text-[#b08968]" />
                          <span>
                            {item.state.plot.width}m × {item.state.plot.height}m
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 rounded-xl text-[#8d7b68] hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete saved layout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="py-1.5 px-3 bg-[#c99a6e]/15 group-hover:bg-[#c99a6e] text-[#c99a6e] group-hover:text-[#18110e] font-bold rounded-xl border border-[#c99a6e]/30 transition flex items-center gap-1 text-[11px]">
                        <span>Load</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
