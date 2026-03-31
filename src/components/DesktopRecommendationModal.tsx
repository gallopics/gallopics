import React, { useState, useEffect } from 'react';
import { X, Monitor, Link, Check } from 'lucide-react';

interface DesktopRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopRecommendationModal: React.FC<
  DesktopRecommendationModalProps
> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      setCopied(false);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container recommendation-modal flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-header-standard">
          <h2 className="modal-title">Use desktop for photographer tools</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-standard text-center">
          <div className="auth-desktop-icon flex items-center justify-center mx-auto text-[var(--color-brand-primary)]">
            <Monitor size={32} />
          </div>
          <p className="text-[var(--color-text-secondary)] leading-relaxed text-[0.875rem]">
            For the best experience, please open Gallopics on a desktop or
            laptop to upload and manage photos.
          </p>
        </div>

        {/* Footer — stacked buttons */}
        <div className="modal-footer-actions flex-col items-stretch gap-3">
          <button className="modal-btn-save w-full" onClick={onClose}>
            Got it
          </button>
          <button
            className="modal-btn-cancel w-full flex items-center justify-center gap-2"
            onClick={handleCopyLink}
            style={
              copied
                ? {
                    color: 'var(--color-success)',
                    background: 'var(--color-success-tint)',
                  }
                : undefined
            }
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Link size={16} /> Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
