import { useState, useEffect, useRef, useCallback } from 'react';
import { CanvasRenderer } from './components/CanvasRenderer';
import type { CanvasRendererHandle } from './components/CanvasRenderer';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { TopBar } from './components/TopBar';
import { ExportModal } from './components/ExportModal';
import { TextEditor } from './components/TextEditor';
import { ShortcutsModal } from './components/ShortcutsModal';
import type { AppState, ExcalidrawElement, ToolType } from './types';
import { DEFAULT_APP_STATE } from './constants';
import { useCanvasInteractions } from './useCanvasInteractions';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/storage';
import { parseExcalidrawJSON } from './utils/exportUtils';
import { getCombinedBounds } from './utils/coordinates';
import { generateSeed } from './utils/roughUtils';

// Initial sample elements showcasing Excalidraw's hand-drawn capabilities
const INITIAL_DEMO_ELEMENTS: ExcalidrawElement[] = [
  {
    id: 'demo-welcome-card',
    type: 'rectangle',
    x: 180,
    y: 120,
    width: 380,
    height: 220,
    angle: 0,
    strokeColor: '#1971c2',
    backgroundColor: '#a5d8ff',
    fillStyle: 'hachure',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    seed: 489201,
    isDeleted: false,
    groupIds: [],
  },
  {
    id: 'demo-welcome-title',
    type: 'text',
    x: 210,
    y: 150,
    width: 320,
    height: 40,
    angle: 0,
    strokeColor: '#1971c2',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    seed: 12984,
    text: 'ExcaliDraw Studio',
    fontSize: 36,
    fontFamily: 'Caveat, cursive',
    isDeleted: false,
    groupIds: [],
  },
  {
    id: 'demo-welcome-desc',
    type: 'text',
    x: 210,
    y: 205,
    width: 320,
    height: 80,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 90,
    seed: 94812,
    text: '• Hand-drawn rough.js visuals\n• Infinite canvas & focal zoom\n• Move, resize & export to JSON/PNG',
    fontSize: 20,
    fontFamily: 'Kalam, cursive',
    isDeleted: false,
    groupIds: [],
  },
  {
    id: 'demo-flow-arrow',
    type: 'arrow',
    x: 560,
    y: 230,
    width: 140,
    height: 40,
    angle: 0,
    strokeColor: '#f08c00',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 3,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    seed: 83910,
    points: [
      [0, 0],
      [140, 40],
    ],
    isDeleted: false,
    groupIds: [],
  },
  {
    id: 'demo-diamond-node',
    type: 'diamond',
    x: 720,
    y: 190,
    width: 160,
    height: 120,
    angle: 0,
    strokeColor: '#2f9e44',
    backgroundColor: '#b2f2bb',
    fillStyle: 'cross-hatch',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    seed: 93821,
    isDeleted: false,
    groupIds: [],
  },
  {
    id: 'demo-diamond-text',
    type: 'text',
    x: 755,
    y: 235,
    width: 90,
    height: 30,
    angle: 0,
    strokeColor: '#2f9e44',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    seed: 4819,
    text: 'Build & Create',
    fontSize: 22,
    fontFamily: 'Caveat, cursive',
    isDeleted: false,
    groupIds: [],
  },
];

export function App() {
  const canvasRendererRef = useRef<CanvasRendererHandle | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial state from LocalStorage or use defaults
  const [elements, setElements] = useState<ExcalidrawElement[]>(() => {
    const saved = loadFromLocalStorage();
    return saved.elements && saved.elements.length > 0
      ? saved.elements
      : INITIAL_DEMO_ELEMENTS;
  });

  const [appState, setAppState] = useState<AppState>(() => {
    const saved = loadFromLocalStorage();
    return {
      ...DEFAULT_APP_STATE,
      ...(saved.appState || {}),
    };
  });

  const [docTitle, setDocTitle] = useState('My Excalidraw Diagram');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<ExcalidrawElement[][]>([]);
  const [redoStack, setRedoStack] = useState<ExcalidrawElement[][]>([]);

  const pushToHistory = useCallback((_newElements?: ExcalidrawElement[]) => {
    setUndoStack((prev) => [...prev.slice(-30), elements]);
    setRedoStack([]);
  }, [elements]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, elements]);
    setElements(previous);
  }, [undoStack, elements]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, elements]);
    setElements(next);
  }, [redoStack, elements]);

  // Sync canvas DOM element ref
  useEffect(() => {
    if (canvasRendererRef.current) {
      canvasRef.current = canvasRendererRef.current.getCanvas();
    }
  });

  // Inline text editing handler
  const openTextEditor = useCallback((elementId: string) => {
    setAppState((prev) => ({
      ...prev,
      editingTextElementId: elementId,
    }));
  }, []);

  const handleCommitText = useCallback(
    (elementId: string, text: string, width: number, height: number) => {
      const updated = elements.map((el) =>
        el.id === elementId
          ? { ...el, text, width, height, isDeleted: false }
          : el,
      );
      setElements(updated);
      pushToHistory(updated);
      setAppState((prev) => ({
        ...prev,
        editingTextElementId: null,
      }));
    },
    [elements, pushToHistory],
  );

  const handleCancelText = useCallback(() => {
    if (appState.editingTextElementId) {
      const updated = elements.filter(
        (el) => el.id !== appState.editingTextElementId || (el.text && el.text.trim().length > 0),
      );
      setElements(updated);
      setAppState((prev) => ({
        ...prev,
        editingTextElementId: null,
      }));
    }
  }, [appState.editingTextElementId, elements]);

  // Canvas Interactions Hook
  const {
    interaction,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  } = useCanvasInteractions({
    canvasRef,
    elements,
    setElements,
    appState,
    setAppState,
    pushToHistory,
    openTextEditor,
  });

  // Selected Elements
  const selectedElements = elements.filter(
    (el) => appState.selectedElementIds[el.id] && !el.isDeleted,
  );

  // Property Updater
  const handleUpdateProperty = useCallback(
    <K extends keyof ExcalidrawElement>(key: K, value: ExcalidrawElement[K]) => {
      // 1. Update selected elements if any
      if (selectedElements.length > 0) {
        const updated = elements.map((el) => {
          if (appState.selectedElementIds[el.id]) {
            return {
              ...el,
              [key]: value,
              // If roughness or stroke width changes, generate new seed for fresh hand-drawn look
              seed: key === 'roughness' ? generateSeed() : el.seed,
            };
          }
          return el;
        });
        setElements(updated);
        pushToHistory(updated);
      }

      // 2. Also update currentItem defaults in AppState
      setAppState((prev) => {
        const updates: Partial<AppState> = {};
        if (key === 'strokeColor') updates.currentItemStrokeColor = value as string;
        if (key === 'backgroundColor') updates.currentItemBackgroundColor = value as string;
        if (key === 'fillStyle') updates.currentItemFillStyle = value as any;
        if (key === 'strokeWidth') updates.currentItemStrokeWidth = value as number;
        if (key === 'strokeStyle') updates.currentItemStrokeStyle = value as any;
        if (key === 'roughness') updates.currentItemRoughness = value as number;
        if (key === 'opacity') updates.currentItemOpacity = value as number;
        if (key === 'fontSize') updates.currentItemFontSize = value as number;
        if (key === 'fontFamily') updates.currentItemFontFamily = value as string;
        return { ...prev, ...updates };
      });
    },
    [selectedElements, elements, appState.selectedElementIds, pushToHistory],
  );

  // Duplicate Selected
  const handleDuplicateSelected = useCallback(() => {
    if (selectedElements.length === 0) return;

    const newElements: ExcalidrawElement[] = [];
    const newSelectedIds: Record<string, boolean> = {};

    selectedElements.forEach((el) => {
      const clonedId = `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cloned: ExcalidrawElement = {
        ...el,
        id: clonedId,
        x: el.x + 24,
        y: el.y + 24,
        seed: generateSeed(),
      };
      newElements.push(cloned);
      newSelectedIds[clonedId] = true;
    });

    const updated = [...elements, ...newElements];
    setElements(updated);
    pushToHistory(updated);
    setAppState((prev) => ({
      ...prev,
      selectedElementIds: newSelectedIds,
    }));
  }, [selectedElements, elements, pushToHistory]);

  // Delete Selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedElements.length === 0) return;

    const updated = elements.map((el) =>
      appState.selectedElementIds[el.id] ? { ...el, isDeleted: true } : el,
    );
    setElements(updated);
    pushToHistory(updated);
    setAppState((prev) => ({
      ...prev,
      selectedElementIds: {},
    }));
  }, [selectedElements, elements, appState.selectedElementIds, pushToHistory]);

  // Bring to Front
  const handleBringToFront = useCallback(() => {
    const unselected = elements.filter((el) => !appState.selectedElementIds[el.id]);
    const selected = elements.filter((el) => appState.selectedElementIds[el.id]);
    const updated = [...unselected, ...selected];
    setElements(updated);
    pushToHistory(updated);
  }, [elements, appState.selectedElementIds, pushToHistory]);

  // Send to Back
  const handleSendToBack = useCallback(() => {
    const unselected = elements.filter((el) => !appState.selectedElementIds[el.id]);
    const selected = elements.filter((el) => appState.selectedElementIds[el.id]);
    const updated = [...selected, ...unselected];
    setElements(updated);
    pushToHistory(updated);
  }, [elements, appState.selectedElementIds, pushToHistory]);

  // Zoom Operations
  const handleZoomIn = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      zoom: Math.min(5, prev.zoom * 1.2),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      zoom: Math.max(0.2, prev.zoom / 1.2),
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      zoom: 1,
    }));
  }, []);

  // Fit to Screen
  const handleFitToScreen = useCallback(() => {
    const active = elements.filter((el) => !el.isDeleted);
    if (active.length === 0) {
      setAppState((prev) => ({ ...prev, zoom: 1, scrollX: 0, scrollY: 0 }));
      return;
    }

    const bounds = getCombinedBounds(active);
    if (!bounds || !canvasRef.current) return;

    const canvasW = canvasRef.current.clientWidth;
    const canvasH = canvasRef.current.clientHeight;
    const padding = 80;

    const scaleX = (canvasW - padding * 2) / bounds.width;
    const scaleY = (canvasH - padding * 2) / bounds.height;
    const newZoom = Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY)));

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const newScrollX = canvasW / 2 / newZoom - centerX;
    const newScrollY = canvasH / 2 / newZoom - centerY;

    setAppState((prev) => ({
      ...prev,
      zoom: newZoom,
      scrollX: newScrollX,
      scrollY: newScrollY,
    }));
  }, [elements]);

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (window.confirm('Clear canvas? All shapes and drawings will be removed.')) {
      setElements([]);
      pushToHistory([]);
      setAppState((prev) => ({
        ...prev,
        selectedElementIds: {},
      }));
    }
  }, [pushToHistory]);

  // Import JSON File
  const handleImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const parsed = parseExcalidrawJSON(text);
          if (parsed) {
            setElements(parsed.elements);
            pushToHistory(parsed.elements);
            if (parsed.appState) {
              setAppState((prev) => ({
                ...prev,
                ...parsed.appState,
                selectedElementIds: {},
              }));
            }
            setDocTitle(file.name.replace(/\.(json|excalidraw)$/, ''));
          } else {
            alert('Invalid Excalidraw JSON file');
          }
        }
      };
      reader.readAsText(file);
    },
    [pushToHistory],
  );

  // Autosave to LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage(elements, appState);
    }, 800);
    return () => clearTimeout(timer);
  }, [elements, appState]);

  // Global Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Tool shortcuts
      const key = e.key.toLowerCase();
      if (key === 'v' || key === '1') setAppState((p) => ({ ...p, activeTool: 'selection' }));
      else if (key === 'r' || key === '2') setAppState((p) => ({ ...p, activeTool: 'rectangle' }));
      else if (key === 'd' || key === '3') setAppState((p) => ({ ...p, activeTool: 'diamond' }));
      else if (key === 'e' || key === '4') setAppState((p) => ({ ...p, activeTool: 'ellipse' }));
      else if (key === 'a' || key === '5') setAppState((p) => ({ ...p, activeTool: 'arrow' }));
      else if (key === 'l' || key === '6') setAppState((p) => ({ ...p, activeTool: 'line' }));
      else if (key === 'p' || key === '7') setAppState((p) => ({ ...p, activeTool: 'freedraw' }));
      else if (key === 't' || key === '8') setAppState((p) => ({ ...p, activeTool: 'text' }));
      else if (key === '0') setAppState((p) => ({ ...p, activeTool: 'eraser' }));
      else if (key === 'h') setAppState((p) => ({ ...p, activeTool: 'pan' }));

      // Escape -> clear selection or cancel
      if (e.key === 'Escape') {
        setAppState((p) => ({
          ...p,
          selectedElementIds: {},
          activeTool: 'selection',
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicateSelected, handleDeleteSelected]);

  // Current editing element for inline text overlay
  const editingElement = elements.find((el) => el.id === appState.editingTextElementId) || null;

  return (
    <div className="app-viewport">
      {/* Top Navigation & Status Bar */}
      <TopBar
        appState={appState}
        setAppState={setAppState}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitToScreen={handleFitToScreen}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onImportFile={handleImportFile}
        onClearCanvas={handleClearCanvas}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        docTitle={docTitle}
        setDocTitle={setDocTitle}
      />

      {/* Floating Center Toolbar */}
      <Toolbar
        activeTool={appState.activeTool}
        onSelectTool={(tool: ToolType) =>
          setAppState((prev) => ({
            ...prev,
            activeTool: tool,
            selectedElementIds: tool !== 'selection' ? {} : prev.selectedElementIds,
          }))
        }
      />

      {/* Left Properties Panel */}
      <PropertiesPanel
        selectedElements={selectedElements}
        appState={appState}
        onUpdateElementProperty={handleUpdateProperty}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={handleDeleteSelected}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />

      {/* Main High-Performance Infinite Canvas */}
      <main className="canvas-wrapper">
        <CanvasRenderer
          ref={canvasRendererRef}
          elements={elements}
          appState={appState}
          interaction={interaction}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        />

        {/* Inline Text Editor Overlay */}
        {editingElement && (
          <TextEditor
            element={editingElement}
            appState={appState}
            onCommitText={handleCommitText}
            onCancel={handleCancelText}
          />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        elements={elements}
        appState={appState}
        docTitle={docTitle}
      />

      {/* Shortcuts & Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

export default App;
