import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ModernDropdown } from '../../../components/ModernDropdown';
import type { PgEvent } from '../../../context/PhotographerContext';

interface ApplyEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PgEvent | null;
  onSubmit: () => void;
}

export const ApplyEventModal: React.FC<ApplyEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSubmit,
}) => {
  const [applyType, setApplyType] = useState<'myself' | 'behalf'>('myself');
  const [photographerName, setPhotographerName] = useState('Klara Fors');
  const [phoneCode, setPhoneCode] = useState('+46');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('klara.fors@example.com');
  const [message, setMessage] = useState('I am interested in this event.');

  const phoneCodeOptions = [
    { label: '+46', value: '+46' },
    { label: '+45', value: '+45' },
    { label: '+47', value: '+47' },
    { label: '+358', value: '+358' },
  ];

  useEffect(() => {
    if (applyType === 'myself') {
      setPhotographerName('Klara Fors');
    } else {
      setPhotographerName('');
    }
  }, [applyType]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
    onClose();
  };

  return (
    <div className="auth-modal-overlay items-center z-[1200]" onClick={onClose}>
      <div
        className="edit-profile-modal-container"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-standard">
          <h2 className="edit-profile-title">Apply for this event</h2>
          <button className="edit-profile-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-standard">
          {/* Event Summary */}
          <div className="bg-[var(--ui-bg-subtle)] p-4 rounded-xl mb-6 border border-[var(--color-border)]">
            <h4 className="m-0 mb-1 text-[15px] font-semibold">
              {event.title}
            </h4>
            <div className="flex flex-col gap-0.5 text-[13px] text-secondary">
              <span>{event.dateRange}</span>
              <span>
                {event.venueName}, {event.city}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleFormSubmit}
            className="edit-profile-form-grid gap-5"
          >
            {/* 1. Apply Type (Myself or Behalf) */}
            <div className="edit-profile-full-width">
              <label className="edit-profile-label">
                Who are you applying for?
              </label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="apply-type"
                    checked={applyType === 'myself'}
                    onChange={() => setApplyType('myself')}
                    className="w-[18px] h-[18px] accent-[var(--color-brand-primary)]"
                  />
                  <span>Myself</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="apply-type"
                    checked={applyType === 'behalf'}
                    onChange={() => setApplyType('behalf')}
                    className="w-[18px] h-[18px] accent-[var(--color-brand-primary)]"
                  />
                  <span>On behalf of someone</span>
                </label>
              </div>
            </div>

            {/* 2. Photographer Name */}
            <div className="edit-profile-full-width">
              <label className="edit-profile-label">Photographer name</label>
              <input
                type="text"
                className="auth-input"
                value={photographerName}
                onChange={e => setPhotographerName(e.target.value)}
                disabled={applyType === 'myself'}
                placeholder="Enter name"
              />
            </div>

            {/* Section: Contact - Header Removed */}
            <div className="edit-profile-full-width border-t border-[var(--ui-bg-subtle)] pt-5 mt-4" />

            {/* 3. Phone Number */}
            <div className="edit-profile-full-width edit-profile-row-2col grid-cols-[100px_1fr]">
              <div>
                <label className="edit-profile-label">Code</label>
                <ModernDropdown
                  value={phoneCode}
                  options={phoneCodeOptions}
                  onChange={setPhoneCode}
                />
              </div>
              <div>
                <label className="edit-profile-label">Phone number</label>
                <input
                  type="tel"
                  className="auth-input w-full"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="70 123 45 67"
                />
              </div>
            </div>

            {/* 4. Email */}
            <div className="edit-profile-full-width">
              <label className="edit-profile-label">Email</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>

            {/* 5. Message */}
            <div className="edit-profile-full-width">
              <label className="edit-profile-label">Message</label>
              <textarea
                className="auth-input h-24 resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="I am interested in this event."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer-actions">
          <button className="edit-profile-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="edit-profile-btn-save" onClick={handleFormSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
