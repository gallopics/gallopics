import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePhotographer } from '../../context/PhotographerContext';
import { ManageHighlightsModal } from '../../components/ManageHighlightsModal';
import { TitleHeader } from '../../components/TitleHeader';

export const Settings: React.FC = () => {
  const {
    highlights,
    updateHighlights,
    availableToHire,
    toggleAvailableToHire,
    photographerId,
  } = usePhotographer();
  const [isHighlightsModalOpen, setIsHighlightsModalOpen] = useState(false);

  return (
    <div className="w-full">
      <TitleHeader
        variant="workspace"
        title="Settings"
        rightContent={
          <Link
            to={`/photographer/${photographerId}`}
            className="pg-btn pg-btn-secondary"
            target="_blank"
          >
            Visit my public profile
          </Link>
        }
      />

      <div className="pg-page-body">
        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 max-w-[800px] mb-6 mx-auto">
          <h2 className="text-[1.1rem] font-semibold text-[var(--color-text-primary)] mt-0 mb-5 pb-4 border-b border-[var(--color-border)]">
            Profile & public page
          </h2>

          <div className="flex justify-between items-center py-4 border-b border-[var(--color-border)]">
            <div className="flex-1 pr-6">
              <div className="text-[0.875rem] font-medium text-[var(--color-text-primary)] mb-1">
                Highlight photos
              </div>
              <div className="text-[0.8125rem] text-[var(--color-text-secondary)]">
                {highlights.length} / 10 selected
              </div>
            </div>
            <button
              className="pg-btn pg-btn-secondary"
              onClick={() => setIsHighlightsModalOpen(true)}
            >
              Manage
            </button>
          </div>

          <div className="flex justify-between items-center py-4">
            <div className="flex-1 pr-6">
              <div className="text-[0.875rem] font-medium text-[var(--color-text-primary)] mb-1">
                Available to hire
              </div>
              <div className="text-[0.8125rem] text-[var(--color-text-secondary)]">
                Allow potential clients to hire you from your public profile
              </div>
            </div>
            <label className="relative inline-block w-12 h-[26px]">
              <input
                type="checkbox"
                className="opacity-0 w-0 h-0"
                checked={availableToHire}
                onChange={e => toggleAvailableToHire(e.target.checked)}
              />
              <span
                className="absolute cursor-pointer inset-0 transition-[background-color] duration-[0.4s] rounded-[34px]"
                style={{
                  backgroundColor: availableToHire
                    ? 'var(--color-brand-primary)'
                    : 'var(--color-border)',
                }}
              >
                <span
                  className="absolute w-5 h-5 bottom-[3px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-[left] duration-[0.4s]"
                  style={{ left: availableToHire ? 25 : 3 }}
                />
              </span>
            </label>
          </div>
        </div>

        <ManageHighlightsModal
          isOpen={isHighlightsModalOpen}
          onClose={() => setIsHighlightsModalOpen(false)}
          initialIds={highlights}
          onSave={updateHighlights}
        />
      </div>
    </div>
  );
};
