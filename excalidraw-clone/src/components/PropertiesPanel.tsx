import React from 'react';
import {
  Copy,
  Trash2,
  BringToFront,
  SendToBack,
  Sliders,
} from 'lucide-react';
import type { AppState, ExcalidrawElement } from '../types';
import {
  STROKE_COLORS,
  BACKGROUND_COLORS,
  FILL_STYLES,
  STROKE_WIDTHS,
  STROKE_STYLES,
  ROUGHNESS_LEVELS,
  FONT_SIZES,
  FONT_FAMILIES,
} from '../constants';

interface PropertiesPanelProps {
  selectedElements: ExcalidrawElement[];
  appState: AppState;
  onUpdateElementProperty: <K extends keyof ExcalidrawElement>(
    key: K,
    value: ExcalidrawElement[K],
  ) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  appState,
  onUpdateElementProperty,
  onDuplicateSelected,
  onDeleteSelected,
  onBringToFront,
  onSendToBack,
}) => {
  const hasSelection = selectedElements.length > 0;
  const firstEl = selectedElements[0];

  // Resolve current values: either from the first selected element or from appState tool defaults
  const currentStrokeColor = hasSelection
    ? firstEl.strokeColor
    : appState.currentItemStrokeColor;
  const currentBackgroundColor = hasSelection
    ? firstEl.backgroundColor
    : appState.currentItemBackgroundColor;
  const currentFillStyle = hasSelection
    ? firstEl.fillStyle
    : appState.currentItemFillStyle;
  const currentStrokeWidth = hasSelection
    ? firstEl.strokeWidth
    : appState.currentItemStrokeWidth;
  const currentStrokeStyle = hasSelection
    ? firstEl.strokeStyle
    : appState.currentItemStrokeStyle;
  const currentRoughness = hasSelection
    ? firstEl.roughness
    : appState.currentItemRoughness;
  const currentOpacity = hasSelection
    ? firstEl.opacity ?? 100
    : appState.currentItemOpacity;
  const currentFontSize = hasSelection
    ? firstEl.fontSize ?? 24
    : appState.currentItemFontSize;
  const currentFontFamily = hasSelection
    ? firstEl.fontFamily ?? 'Caveat, cursive'
    : appState.currentItemFontFamily;

  const isTextElement = hasSelection && firstEl.type === 'text';

  return (
    <aside
      className="properties-panel"
      aria-label="Element Properties Inspector"
    >
      <div className="panel-header">
        <Sliders size={16} />
        <span>{hasSelection ? 'Element Properties' : 'Tool Defaults'}</span>
      </div>

      <div className="panel-content">
        {/* Stroke Color */}
        <section className="property-group">
          <label className="property-label">Stroke</label>
          <div className="color-swatches-grid">
            {STROKE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch ${currentStrokeColor === color ? 'color-swatch-active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onUpdateElementProperty('strokeColor', color)}
                title={color}
              />
            ))}
          </div>
        </section>

        {/* Background / Fill Color */}
        {!isTextElement && (
          <section className="property-group">
            <label className="property-label">Background</label>
            <div className="color-swatches-grid">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${currentBackgroundColor === color ? 'color-swatch-active' : ''} ${
                    color === 'transparent' ? 'swatch-transparent' : ''
                  }`}
                  style={{
                    backgroundColor: color === 'transparent' ? '#ffffff' : color,
                  }}
                  onClick={() => onUpdateElementProperty('backgroundColor', color)}
                  title={color}
                >
                  {color === 'transparent' && <span className="transparent-slash" />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Fill Style */}
        {!isTextElement && currentBackgroundColor !== 'transparent' && (
          <section className="property-group">
            <label className="property-label">Fill Style</label>
            <div className="button-group-row">
              {FILL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`property-btn ${currentFillStyle === style.id ? 'property-btn-active' : ''}`}
                  onClick={() => onUpdateElementProperty('fillStyle', style.id)}
                  title={style.label}
                >
                  <span className="fill-icon">{style.icon}</span>
                  <span className="btn-text">{style.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Stroke Width */}
        <section className="property-group">
          <label className="property-label">Stroke Width</label>
          <div className="button-group-row">
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.value}
                type="button"
                className={`property-btn ${currentStrokeWidth === sw.value ? 'property-btn-active' : ''}`}
                onClick={() => onUpdateElementProperty('strokeWidth', sw.value)}
              >
                <div
                  className="stroke-width-indicator"
                  style={{ height: `${sw.value * 2}px` }}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Stroke Style */}
        <section className="property-group">
          <label className="property-label">Stroke Style</label>
          <div className="button-group-row">
            {STROKE_STYLES.map((ss) => (
              <button
                key={ss.id}
                type="button"
                className={`property-btn ${currentStrokeStyle === ss.id ? 'property-btn-active' : ''}`}
                onClick={() => onUpdateElementProperty('strokeStyle', ss.id)}
              >
                {ss.label}
              </button>
            ))}
          </div>
        </section>

        {/* Roughness (Hand-drawn wobbly aesthetics) */}
        {!isTextElement && (
          <section className="property-group">
            <label className="property-label">Sloppiness (Roughness)</label>
            <div className="button-group-row">
              {ROUGHNESS_LEVELS.map((rl) => (
                <button
                  key={rl.value}
                  type="button"
                  className={`property-btn ${currentRoughness === rl.value ? 'property-btn-active' : ''}`}
                  onClick={() => onUpdateElementProperty('roughness', rl.value)}
                >
                  {rl.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Typography settings for Text */}
        {isTextElement && (
          <>
            <section className="property-group">
              <label className="property-label">Font Size</label>
              <div className="button-group-row">
                {FONT_SIZES.map((fs) => (
                  <button
                    key={fs.value}
                    type="button"
                    className={`property-btn ${currentFontSize === fs.value ? 'property-btn-active' : ''}`}
                    onClick={() => onUpdateElementProperty('fontSize', fs.value)}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="property-group">
              <label className="property-label">Font Family</label>
              <div className="button-group-row">
                {FONT_FAMILIES.map((ff) => (
                  <button
                    key={ff.value}
                    type="button"
                    className={`property-btn ${currentFontFamily === ff.value ? 'property-btn-active' : ''}`}
                    onClick={() => onUpdateElementProperty('fontFamily', ff.value)}
                    style={{ fontFamily: ff.value }}
                  >
                    {ff.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Opacity Slider */}
        <section className="property-group">
          <div className="property-label-with-val">
            <span className="property-label">Opacity</span>
            <span className="property-val">{currentOpacity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={currentOpacity}
            onChange={(e) => onUpdateElementProperty('opacity', Number(e.target.value))}
            className="property-slider"
          />
        </section>

        {/* Layer & Selection Actions (when elements are selected) */}
        {hasSelection && (
          <section className="property-group panel-actions-group">
            <label className="property-label">Actions</label>
            <div className="action-buttons-row">
              <button
                type="button"
                className="action-btn"
                onClick={onBringToFront}
                title="Bring to Front"
              >
                <BringToFront size={16} />
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={onSendToBack}
                title="Send to Back"
              >
                <SendToBack size={16} />
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={onDuplicateSelected}
                title="Duplicate (Ctrl+D)"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                className="action-btn action-btn-danger"
                onClick={onDeleteSelected}
                title="Delete (Backspace/Del)"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};
