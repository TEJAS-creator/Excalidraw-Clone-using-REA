import type { AppState, ExcalidrawElement } from '../types';

const STORAGE_KEY_ELEMENTS = 'excalidraw_clone_elements';
const STORAGE_KEY_APPSTATE = 'excalidraw_clone_appstate';

export function saveToLocalStorage(elements: ExcalidrawElement[], appState: AppState): void {
  try {
    const activeElements = elements.filter((el) => !el.isDeleted);
    localStorage.setItem(STORAGE_KEY_ELEMENTS, JSON.stringify(activeElements));
    localStorage.setItem(
      STORAGE_KEY_APPSTATE,
      JSON.stringify({
        viewBackgroundColor: appState.viewBackgroundColor,
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        gridEnabled: appState.gridEnabled,
        currentItemStrokeColor: appState.currentItemStrokeColor,
        currentItemBackgroundColor: appState.currentItemBackgroundColor,
        currentItemFillStyle: appState.currentItemFillStyle,
        currentItemStrokeWidth: appState.currentItemStrokeWidth,
        currentItemStrokeStyle: appState.currentItemStrokeStyle,
        currentItemRoughness: appState.currentItemRoughness,
      }),
    );
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

export function loadFromLocalStorage(): {
  elements: ExcalidrawElement[] | null;
  appState: Partial<AppState> | null;
} {
  try {
    const rawElements = localStorage.getItem(STORAGE_KEY_ELEMENTS);
    const rawAppState = localStorage.getItem(STORAGE_KEY_APPSTATE);

    const elements = rawElements ? JSON.parse(rawElements) : null;
    const appState = rawAppState ? JSON.parse(rawAppState) : null;

    return { elements, appState };
  } catch (e) {
    console.warn('LocalStorage load failed:', e);
    return { elements: null, appState: null };
  }
}
