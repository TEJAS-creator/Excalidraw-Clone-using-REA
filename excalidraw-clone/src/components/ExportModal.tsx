import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, FileCode, Copy, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AppState, ExcalidrawElement } from '../types';
import { exportToExcalidrawJSON, exportToPNG, triggerFileDownload } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ExcalidrawElement[];
  appState: AppState;
  docTitle: string;
}

export const ExportModal = ({
  isOpen,
  onClose,
  elements,
  appState,
  docTitle,
}: ExportModalProps) => {
  const [withBackground, setWithBackground] = useState(true);
  const [scale, setScale] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Generate preview thumbnail whenever options change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    exportToPNG(elements, {
      scale: 1,
      withBackground,
      backgroundColor: appState.viewBackgroundColor,
      padding: 20,
    }).then((url) => {
      if (isMounted) setPreviewUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, elements, withBackground, appState.viewBackgroundColor]);

  if (!isOpen) return null;

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const url = await exportToPNG(elements, {
        scale,
        withBackground,
        backgroundColor: appState.viewBackgroundColor,
        padding: 40,
      });

      if (url) {
        triggerFileDownload(url, `${docTitle || 'diagram'}.png`);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
        onClose();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportToExcalidrawJSON(elements, appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    triggerFileDownload(url, `${docTitle || 'diagram'}.excalidraw`);
    URL.revokeObjectURL(url);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
    });
    onClose();
  };

  const handleCopyToClipboard = async () => {
    try {
      const url = await exportToPNG(elements, {
        scale,
        withBackground,
        backgroundColor: appState.viewBackgroundColor,
        padding: 30,
      });

      if (url) {
        const res = await fetch(url);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Sparkles size={20} className="modal-sparkle-icon" />
            <h2 className="modal-title">Export Canvas</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Live Preview Box */}
          <div className="export-preview-container">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Scene export preview"
                className="export-preview-img"
              />
            ) : (
              <div className="export-empty-preview">
                <span>No elements on canvas to export</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="export-options-section">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={withBackground}
                onChange={(e) => setWithBackground(e.target.checked)}
              />
              <span>Include canvas background ({appState.viewBackgroundColor})</span>
            </label>

            <div className="scale-selector-row">
              <span className="scale-label">Resolution Scale:</span>
              <div className="button-group-row">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`property-btn ${scale === s ? 'property-btn-active' : ''}`}
                    onClick={() => setScale(s)}
                  >
                    {s}x {s === 2 ? '(Retina)' : s === 3 ? '(Ultra)' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="export-actions-grid">
            <button
              type="button"
              className="export-action-btn export-action-primary"
              onClick={handleExportPNG}
              disabled={isExporting}
            >
              <ImageIcon size={18} />
              <span>Export as PNG Image</span>
            </button>

            <button
              type="button"
              className="export-action-btn export-action-secondary"
              onClick={handleExportJSON}
            >
              <FileCode size={18} />
              <span>Save as .excalidraw JSON</span>
            </button>

            <button
              type="button"
              className="export-action-btn export-action-outline"
              onClick={handleCopyToClipboard}
            >
              {isCopied ? <Check size={18} color="#2f9e44" /> : <Copy size={18} />}
              <span>{isCopied ? 'Copied to Clipboard!' : 'Copy PNG to Clipboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
