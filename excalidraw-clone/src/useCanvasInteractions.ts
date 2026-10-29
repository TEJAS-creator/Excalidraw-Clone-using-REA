import type { Dispatch, SetStateAction, RefObject, PointerEvent, WheelEvent } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { AppState, ExcalidrawElement } from './types';
import {
  screenToWorld,
  computeZoomAroundPoint,
  getElementBounds,
  getCombinedBounds,
  doBoxesIntersect,
} from './utils/coordinates';
import {
  isPointHittingElement,
  getResizeHandleAtPoint,
  getCursorForResizeHandle,
} from './utils/hitTest';
import { createNewElement, INITIAL_INTERACTION_STATE } from './interactionHandler';
import type { InteractionState } from './interactionHandler';

interface UseCanvasInteractionsProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  elements: ExcalidrawElement[];
  setElements: Dispatch<SetStateAction<ExcalidrawElement[]>>;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  pushToHistory: (newElements: ExcalidrawElement[]) => void;
  openTextEditor: (elementId: string, worldX: number, worldY: number) => void;
}

export function useCanvasInteractions({
  canvasRef,
  elements,
  setElements,
  appState,
  setAppState,
  pushToHistory,
  openTextEditor,
}: UseCanvasInteractionsProps) {
  const [interaction, setInteraction] = useState<InteractionState>(INITIAL_INTERACTION_STATE);

  // References to keep event handlers fresh without re-binding
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;

  // Selected elements helper
  const getSelectedElements = useCallback(() => {
    return elementsRef.current.filter((el) => appStateRef.current.selectedElementIds[el.id] && !el.isDeleted);
  }, []);

  // Pointer Down
  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = screenToWorld(
        screenX,
        screenY,
        appStateRef.current.scrollX,
        appStateRef.current.scrollY,
        appStateRef.current.zoom,
      );

      // Check for Pan action (Middle click or Spacebar held)
      if (e.button === 1 || appStateRef.current.isSpacePressed || appStateRef.current.activeTool === 'pan') {
        setInteraction((prev) => ({
          ...prev,
          mode: 'panning',
          startX: screenX,
          startY: screenY,
          cursor: 'grabbing',
        }));
        return;
      }

      // Left click only for drawing / selecting
      if (e.button !== 0) return;

      const currentTool = appStateRef.current.activeTool;

      // Eraser Tool
      if (currentTool === 'eraser') {
        const hit = [...elementsRef.current]
          .reverse()
          .find((el) => isPointHittingElement(worldPoint.x, worldPoint.y, el));
        if (hit) {
          const updated = elementsRef.current.map((el) =>
            el.id === hit.id ? { ...el, isDeleted: true } : el,
          );
          setElements(updated);
          pushToHistory(updated);
        }
        return;
      }

      // Text Tool
      if (currentTool === 'text') {
        const newEl = createNewElement('text', worldPoint.x, worldPoint.y, appStateRef.current);
        const updated = [...elementsRef.current, newEl];
        setElements(updated);
        setAppState((prev) => ({
          ...prev,
          activeTool: 'selection',
          selectedElementIds: { [newEl.id]: true },
        }));
        openTextEditor(newEl.id, worldPoint.x, worldPoint.y);
        return;
      }

      // Selection Tool
      if (currentTool === 'selection') {
        const selectedEls = getSelectedElements();

        // 1. Check if clicking on a resize handle
        if (selectedEls.length > 0) {
          const combined = getCombinedBounds(selectedEls);
          if (combined) {
            const handle = getResizeHandleAtPoint(
              worldPoint.x,
              worldPoint.y,
              combined,
              appStateRef.current.zoom,
            );
            if (handle) {
              const initialPos: Record<string, { x: number; y: number }> = {};
              selectedEls.forEach((el) => {
                initialPos[el.id] = { x: el.x, y: el.y };
              });

              setInteraction((prev) => ({
                ...prev,
                mode: 'resizing',
                startX: screenX,
                startY: screenY,
                startWorldX: worldPoint.x,
                startWorldY: worldPoint.y,
                activeResizeHandle: handle,
                dragInitialPositions: initialPos,
                cursor: getCursorForResizeHandle(handle),
              }));
              return;
            }
          }
        }

        // 2. Check if clicking an element
        const hitElement = [...elementsRef.current]
          .reverse()
          .find((el) => isPointHittingElement(worldPoint.x, worldPoint.y, el));

        if (hitElement) {
          const isAlreadySelected = !!appStateRef.current.selectedElementIds[hitElement.id];

          let newSelectedIds: Record<string, boolean>;
          if (e.shiftKey) {
            newSelectedIds = {
              ...appStateRef.current.selectedElementIds,
              [hitElement.id]: !isAlreadySelected,
            };
          } else {
            newSelectedIds = isAlreadySelected
              ? appStateRef.current.selectedElementIds
              : { [hitElement.id]: true };
          }

          setAppState((prev) => ({
            ...prev,
            selectedElementIds: newSelectedIds,
          }));

          // Prepare dragging
          const initialPos: Record<string, { x: number; y: number; points?: [number, number][] }> = {};
          elementsRef.current.forEach((el) => {
            if (newSelectedIds[el.id]) {
              initialPos[el.id] = {
                x: el.x,
                y: el.y,
                points: el.points ? [...el.points] : undefined,
              };
            }
          });

          setInteraction((prev) => ({
            ...prev,
            mode: 'dragging',
            startX: screenX,
            startY: screenY,
            startWorldX: worldPoint.x,
            startWorldY: worldPoint.y,
            dragInitialPositions: initialPos,
            cursor: 'move',
          }));
          return;
        }

        // 3. Clicked empty space -> start marquee box selection
        if (!e.shiftKey) {
          setAppState((prev) => ({
            ...prev,
            selectedElementIds: {},
          }));
        }

        setInteraction((prev) => ({
          ...prev,
          mode: 'marquee',
          startX: screenX,
          startY: screenY,
          startWorldX: worldPoint.x,
          startWorldY: worldPoint.y,
          marqueeBox: {
            minX: worldPoint.x,
            minY: worldPoint.y,
            maxX: worldPoint.x,
            maxY: worldPoint.y,
          },
          cursor: 'crosshair',
        }));
        return;
      }

      // Drawing Tool (rectangle, diamond, ellipse, arrow, line, freedraw)
      const newElement = createNewElement(currentTool, worldPoint.x, worldPoint.y, appStateRef.current);
      setElements((prev) => [...prev, newElement]);

      setInteraction((prev) => ({
        ...prev,
        mode: 'drawing',
        startX: screenX,
        startY: screenY,
        startWorldX: worldPoint.x,
        startWorldY: worldPoint.y,
        currentDrawingElementId: newElement.id,
        cursor: 'crosshair',
      }));
    },
    [canvasRef, setElements, setAppState, pushToHistory, openTextEditor, getSelectedElements],
  );

  // Pointer Move
  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPoint = screenToWorld(
        screenX,
        screenY,
        appStateRef.current.scrollX,
        appStateRef.current.scrollY,
        appStateRef.current.zoom,
      );

      const { mode, startX, startY, startWorldX, startWorldY, currentDrawingElementId, activeResizeHandle } =
        interactionRef.current;

      // 1. Panning
      if (mode === 'panning') {
        const deltaX = (screenX - startX) / appStateRef.current.zoom;
        const deltaY = (screenY - startY) / appStateRef.current.zoom;

        setAppState((prev) => ({
          ...prev,
          scrollX: prev.scrollX + deltaX,
          scrollY: prev.scrollY + deltaY,
        }));

        setInteraction((prev) => ({
          ...prev,
          startX: screenX,
          startY: screenY,
        }));
        return;
      }

      // 2. Dragging Elements
      if (mode === 'dragging') {
        const deltaX = worldPoint.x - startWorldX;
        const deltaY = worldPoint.y - startWorldY;
        const { dragInitialPositions } = interactionRef.current;

        setElements((prev) =>
          prev.map((el) => {
            const init = dragInitialPositions[el.id];
            if (!init) return el;
            return {
              ...el,
              x: init.x + deltaX,
              y: init.y + deltaY,
            };
          }),
        );
        return;
      }

      // 3. Resizing Elements
      if (mode === 'resizing' && activeResizeHandle) {
        const { dragInitialPositions } = interactionRef.current;

        setElements((prev) =>
          prev.map((el) => {
            const init = dragInitialPositions[el.id];
            if (!init) return el;

            let newX = el.x;
            let newY = el.y;
            let newW = el.width;
            let newH = el.height;

            if (activeResizeHandle.includes('e')) newW = worldPoint.x - el.x;
            if (activeResizeHandle.includes('s')) newH = worldPoint.y - el.y;
            if (activeResizeHandle.includes('w')) {
              newX = worldPoint.x;
              newW = el.x + el.width - worldPoint.x;
            }
            if (activeResizeHandle.includes('n')) {
              newY = worldPoint.y;
              newH = el.y + el.height - worldPoint.y;
            }

            return {
              ...el,
              x: newX,
              y: newY,
              width: newW,
              height: newH,
            };
          }),
        );
        return;
      }

      // 4. Drawing New Element
      if (mode === 'drawing' && currentDrawingElementId) {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== currentDrawingElementId) return el;

            const dx = worldPoint.x - el.x;
            const dy = worldPoint.y - el.y;

            if (el.type === 'freedraw') {
              const currentPoints = el.points || [[0, 0]];
              return {
                ...el,
                points: [...currentPoints, [dx, dy]],
              };
            }

            if (el.type === 'line' || el.type === 'arrow') {
              return {
                ...el,
                width: dx,
                height: dy,
                points: [
                  [0, 0],
                  [dx, dy],
                ],
              };
            }

            return {
              ...el,
              width: dx,
              height: dy,
            };
          }),
        );
        return;
      }

      // 5. Marquee Selection
      if (mode === 'marquee') {
        const box = {
          minX: Math.min(startWorldX, worldPoint.x),
          minY: Math.min(startWorldY, worldPoint.y),
          maxX: Math.max(startWorldX, worldPoint.x),
          maxY: Math.max(startWorldY, worldPoint.y),
        };

        const newlySelected: Record<string, boolean> = {};
        elementsRef.current.forEach((el) => {
          if (el.isDeleted) return;
          const bounds = getElementBounds(el);
          if (
            doBoxesIntersect(
              { ...box, width: box.maxX - box.minX, height: box.maxY - box.minY },
              bounds,
            )
          ) {
            newlySelected[el.id] = true;
          }
        });

        setAppState((prev) => ({
          ...prev,
          selectedElementIds: newlySelected,
        }));

        setInteraction((prev) => ({
          ...prev,
          marqueeBox: box,
        }));
        return;
      }

      // 6. Idle Hover Cursor updates
      if (mode === 'idle') {
        if (appStateRef.current.isSpacePressed || appStateRef.current.activeTool === 'pan') {
          setInteraction((prev) => ({ ...prev, cursor: 'grab' }));
          return;
        }

        if (appStateRef.current.activeTool === 'selection') {
          const selectedEls = getSelectedElements();
          if (selectedEls.length > 0) {
            const combined = getCombinedBounds(selectedEls);
            if (combined) {
              const handle = getResizeHandleAtPoint(
                worldPoint.x,
                worldPoint.y,
                combined,
                appStateRef.current.zoom,
              );
              if (handle) {
                setInteraction((prev) => ({
                  ...prev,
                  cursor: getCursorForResizeHandle(handle),
                }));
                return;
              }
            }
          }

          const hit = [...elementsRef.current]
            .reverse()
            .find((el) => isPointHittingElement(worldPoint.x, worldPoint.y, el));
          if (hit) {
            setInteraction((prev) => ({ ...prev, cursor: 'move' }));
            return;
          }

          setInteraction((prev) => ({ ...prev, cursor: 'default' }));
          return;
        }

        if (appStateRef.current.activeTool === 'eraser') {
          setInteraction((prev) => ({ ...prev, cursor: 'crosshair' }));
          return;
        }

        setInteraction((prev) => ({ ...prev, cursor: 'crosshair' }));
      }
    },
    [canvasRef, setElements, setAppState, getSelectedElements],
  );

  // Pointer Up
  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }

      const { mode, currentDrawingElementId } = interactionRef.current;

      if (mode === 'drawing' && currentDrawingElementId) {
        // Normalize geometric shapes (make width/height positive)
        const updated = elementsRef.current.map((el) => {
          if (el.id !== currentDrawingElementId) return el;

          if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse') {
            const normalizedX = el.width < 0 ? el.x + el.width : el.x;
            const normalizedY = el.height < 0 ? el.y + el.height : el.y;
            const normalizedW = Math.abs(el.width);
            const normalizedH = Math.abs(el.height);

            // Discard tiny accidental clicks
            if (normalizedW < 3 && normalizedH < 3) {
              return { ...el, isDeleted: true };
            }

            return {
              ...el,
              x: normalizedX,
              y: normalizedY,
              width: normalizedW,
              height: normalizedH,
            };
          }

          return el;
        });

        const activeElements = updated.filter((el) => !el.isDeleted);
        setElements(updated);
        pushToHistory(updated);

        // Auto select created element and switch to selection
        const created = activeElements.find((el) => el.id === currentDrawingElementId);
        if (created) {
          setAppState((prev) => ({
            ...prev,
            activeTool: 'selection',
            selectedElementIds: { [created.id]: true },
          }));
        }
      } else if (mode === 'dragging' || mode === 'resizing') {
        pushToHistory(elementsRef.current);
      }

      setInteraction((prev) => ({
        ...prev,
        mode: 'idle',
        activeResizeHandle: null,
        currentDrawingElementId: null,
        marqueeBox: null,
        cursor: appStateRef.current.isSpacePressed ? 'grab' : 'default',
      }));
    },
    [canvasRef, setElements, setAppState, pushToHistory],
  );

  // Wheel (Pan and Zoom around pointer)
  const handleWheel = useCallback(
    (e: WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Zoom around cursor
        const zoomDelta = Math.exp(-e.deltaY * 0.003);
        const { newZoom, newScrollX, newScrollY } = computeZoomAroundPoint(
          screenX,
          screenY,
          appStateRef.current.zoom,
          zoomDelta,
          appStateRef.current.scrollX,
          appStateRef.current.scrollY,
        );

        setAppState((prev) => ({
          ...prev,
          zoom: newZoom,
          scrollX: newScrollX,
          scrollY: newScrollY,
        }));
      } else {
        // Pan
        setAppState((prev) => ({
          ...prev,
          scrollX: prev.scrollX - e.deltaX / prev.zoom,
          scrollY: prev.scrollY - e.deltaY / prev.zoom,
        }));
      }
    },
    [canvasRef, setAppState],
  );

  // Keyboard navigation & space pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing inside textarea or input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space' && !appStateRef.current.isSpacePressed) {
        e.preventDefault();
        setAppState((prev) => ({ ...prev, isSpacePressed: true }));
        setInteraction((prev) => ({ ...prev, cursor: 'grab' }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setAppState((prev) => ({ ...prev, isSpacePressed: false }));
        setInteraction((prev) => ({ ...prev, cursor: 'default' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setAppState]);

  return {
    interaction,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  };
}
