import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { useRef } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload,
  Trash2,
  Grid,
  HelpCircle,
  FileEdit,
} from 'lucide-react';
import type { AppState } from '../types';
import { CANVAS_BACKGROUNDS } from '../constants';

interface TopBarProps {
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  onOpenExportModal: () => void;
  onImportFile: (file: File) => void;
  onClearCanvas: () => void;
  onOpenShortcuts: () => void;
  docTitle: string;
  setDocTitle: (title: string) => void;
}

export const TopBar = ({
  appState,
  setAppState,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  onOpenExportModal,
  onImportFile,
  onClearCanvas,
  onOpenShortcuts,
  docTitle,
  setDocTitle,
}: TopBarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  };

  const zoomPercent = Math.round(appState.zoom * 100);

  return (
    <header className="topbar-header" aria-label="Main Application Bar">
      {/* Brand & Document Name */}
      <div className="topbar-left">
        <div className="brand-group">
          <div className="brand-icon">✏️</div>
          <div className="brand-text">
            <span className="brand-title">ExcaliDraw</span>
            <span className="brand-badge">STUDIO</span>
          </div>
        </div>

        <div className="doc-title-container">
          <FileEdit size={14} className="doc-title-icon" />
          <input
            type="text"
            className="doc-title-input"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            title="Rename canvas"
          />
        </div>
      </div>

      {/* Undo / Redo & Zoom Controls */}
      <div className="topbar-center">
        <div className="pill-group">
          <button
            type="button"
            className="topbar-btn"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            className="topbar-btn"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="pill-group">
          <button
            type="button"
            className="topbar-btn"
            onClick={onZoomOut}
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className="zoom-display-btn"
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            className="topbar-btn"
            onClick={onZoomIn}
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="topbar-btn"
            onClick={onFitToScreen}
            title="Fit to Screen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Canvas Theme, Grid, Import/Export */}
      <div className="topbar-right">
        {/* Canvas Theme / Color Select */}
        <div className="theme-selector-pill">
          {CANVAS_BACKGROUNDS.map((theme) => (
            <button
              key={theme.value}
              type="button"
              className={`theme-dot ${appState.viewBackgroundColor === theme.value ? 'theme-dot-active' : ''}`}
              style={{ backgroundColor: theme.value }}
              onClick={() =>
                setAppState((prev) => ({
                  ...prev,
                  viewBackgroundColor: theme.value,
                }))
              }
              title={theme.label}
            />
          ))}
        </div>

        {/* Grid Toggle */}
        <button
          type="button"
          className={`topbar-btn ${appState.gridEnabled ? 'topbar-btn-active' : ''}`}
          onClick={() =>
            setAppState((prev) => ({ ...prev, gridEnabled: !prev.gridEnabled }))
          }
          title="Toggle Grid (Ctrl+')"
        >
          <Grid size={16} />
        </button>

        {/* Hidden File Input for Importing */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.excalidraw"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {/* Import */}
        <button
          type="button"
          className="topbar-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Open Excalidraw JSON"
        >
          <Upload size={16} />
        </button>

        {/* Export */}
        <button
          type="button"
          className="topbar-btn topbar-btn-primary"
          onClick={onOpenExportModal}
          title="Export Canvas"
        >
          <Download size={16} />
          <span>Export</span>
        </button>

        {/* Clear */}
        <button
          type="button"
          className="topbar-btn topbar-btn-danger"
          onClick={onClearCanvas}
          title="Clear Canvas"
        >
          <Trash2 size={16} />
        </button>

        {/* Help / Shortcuts */}
        <button
          type="button"
          className="topbar-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
