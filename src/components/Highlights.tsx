import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Photo } from '../types';

interface HighlightsProps {
  items: Photo[];
}

export const Highlights: React.FC<HighlightsProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const highlightPhotos = items;

  const openCarousel = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const closeCarousel = () => setIsOpen(false);

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex(prev => (prev + 1) % highlightPhotos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex(
      prev => (prev - 1 + highlightPhotos.length) % highlightPhotos.length,
    );
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCarousel();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightPhotos.length]);

  return (
    <>
      {/* Highlights Grid */}
      <div className="grid grid-cols-3 gap-[4px] w-full max-w-[935px] mx-auto md:grid-cols-4 max-md:gap-[2px]">
        {highlightPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="aspect-square bg-[var(--ui-bg-subtle)] cursor-pointer overflow-hidden group"
            onClick={() => openCarousel(index)}
          >
            <img
              src={photo.src}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover block transition-opacity duration-200 group-hover:opacity-90"
            />
          </div>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/[0.95] z-[9999] flex items-center justify-center backdrop-blur-[5px]"
          onClick={closeCarousel}
        >
          <button
            className="absolute top-6 right-6 bg-none border-none text-white cursor-pointer p-2 z-[10001] opacity-80 transition-opacity duration-200 hover:opacity-100"
            onClick={closeCarousel}
          >
            <X size={32} />
          </button>

          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-[90%] max-h-[90vh] flex items-center justify-center">
              <img
                src={highlightPhotos[activeIndex].src}
                alt=""
                className="max-w-full max-h-[90vh] object-contain shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              />
            </div>

            {highlightPhotos.length > 1 && (
              <>
                <button
                  className="absolute top-1/2 -translate-y-1/2 left-6 max-md:left-3 bg-white/10 border-none text-white cursor-pointer p-3 max-md:p-2 rounded-full flex items-center justify-center transition-[background] duration-200 z-[10000] hover:bg-white/20"
                  onClick={prevPhoto}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute top-1/2 -translate-y-1/2 right-6 max-md:right-3 bg-white/10 border-none text-white cursor-pointer p-3 max-md:p-2 rounded-full flex items-center justify-center transition-[background] duration-200 z-[10000] hover:bg-white/20"
                  onClick={nextPhoto}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
