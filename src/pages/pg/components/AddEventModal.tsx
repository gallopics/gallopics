import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ModernDropdown } from '../../../components/ModernDropdown';
import { MultiSelect } from '../../../components/MultiSelect';
import { Toggle } from '../../../components/Toggle';
import { PHOTOGRAPHERS } from '../../../data/mockData';
import { assetUrl } from '../../../lib/utils';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: any; // If present, prefill for edit mode
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
}) => {
  const isEditMode = !!eventToEdit;
  // Form State
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [country, setCountry] = useState('Sweden');
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [arena, setArena] = useState('');
  const [category, setCategory] = useState('');
  const [organiser, setOrganiser] = useState('');
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>(
    [],
  );
  const [applicationsWelcomed, setApplicationsWelcomed] = useState(true);

  // Prefill for edit mode
  useEffect(() => {
    if (isOpen && eventToEdit) {
      setEventName(eventToEdit.title || '');

      // Handle date parsing/mocking
      if (eventToEdit.dateRange) {
        // If we had real dates we'd parse them, here we'll mock them
        setStartDate('2024-05-15');
        setEndDate('2024-05-17');
      }

      setCity(eventToEdit.city || '');
      setArena(eventToEdit.venueName || '');
      setCategory(eventToEdit.disciplines?.[0] || '');
      setOrganiser('Mock Organiser Ltd');
      setSelectedPhotographers(
        eventToEdit.assignedPhotographers?.map((p: any) => p.id) || [],
      );
      setApplicationsWelcomed(eventToEdit.applicationsWelcomed !== false);
    } else if (isOpen) {
      // Reset for Add mode
      setEventName('');
      setStartDate('');
      setEndDate('');
      setCity('');
      setArena('');
      setCategory('');
      setOrganiser('');
      setSelectedPhotographers([]);
      setApplicationsWelcomed(true);
    }
  }, [isOpen, eventToEdit]);

  // Mock Options
  const countryOptions = [
    { label: 'Sweden', value: 'Sweden', icon: '🇸🇪' },
    { label: 'Norway', value: 'Norway', icon: '🇳🇴' },
    { label: 'Denmark', value: 'Denmark', icon: '🇩🇰' },
    { label: 'Finland', value: 'Finland', icon: '🇫🇮' },
  ];

  const countyOptions = [
    { label: 'Stockholm', value: 'Stockholm' },
    { label: 'Västra Götaland', value: 'Vastra Gotaland' },
    { label: 'Skåne', value: 'Skane' },
    { label: 'Uppsala', value: 'Uppsala' },
  ];

  const cityOptions =
    country === 'Sweden'
      ? [
          { label: 'Stockholm', value: 'Stockholm' },
          { label: 'Göteborg', value: 'Goteborg' },
          { label: 'Malmö', value: 'Malmo' },
          { label: 'Uppsala', value: 'Uppsala' },
          { label: 'Jönköping', value: 'Jonkoping' },
        ]
      : [
          { label: 'Oslo', value: 'Oslo' },
          { label: 'Copenhagen', value: 'Copenhagen' },
          { label: 'Helsinki', value: 'Helsinki' },
        ];

  const categoryOptions = [
    { label: 'Show jumping', value: 'Show jumping' },
    { label: 'Dressage', value: 'Dressage' },
    { label: 'Eventing', value: 'Eventing' },
    { label: 'Western', value: 'Western' },
  ];

  const photographerOptions = PHOTOGRAPHERS.map(p => ({
    label: `${p.firstName} ${p.lastName}`,
    value: p.id,
    subtext: p.city,
    icon: assetUrl(`images/${p.firstName} ${p.lastName}.jpg`),
  }));

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

  if (!isOpen) return null;

  const handleDone = () => {
    console.log('New Event Data:', {
      eventName,
      startDate,
      endDate,
      country,
      city,
      arena,
      category,
      organiser,
      selectedPhotographers,
      applicationsWelcomed,
    });
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
          <h2 className="edit-profile-title">
            {isEditMode ? 'Edit event' : 'Add an event'}
          </h2>
          <button className="edit-profile-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-standard">
          <div className="edit-profile-form-grid gap-5">
            {/* 1. Event Name */}
            <div className="edit-profile-full-width">
              <label className="edit-profile-label">Event name</label>
              <input
                type="text"
                className="auth-input"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="Enter event name"
              />
            </div>

            {/* 2. Period */}
            <div>
              <label className="edit-profile-label">Start date</label>
              <input
                type="date"
                className="auth-input w-full"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="edit-profile-label">End date</label>
              <input
                type="date"
                className="auth-input w-full"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            {/* 3. Location Row (3 col) */}
            <div className="edit-profile-full-width edit-profile-row-3col">
              <div className="min-w-0">
                <label className="edit-profile-label">Country</label>
                <ModernDropdown
                  value={country}
                  options={countryOptions}
                  onChange={val => {
                    setCountry(val);
                    setCity('');
                  }}
                  placeholder="Select country"
                />
              </div>
              <div className="min-w-0">
                <label className="edit-profile-label">County</label>
                <ModernDropdown
                  value={county}
                  options={countyOptions}
                  onChange={setCounty}
                  placeholder="Select county"
                />
              </div>
              <div className="min-w-0">
                <label className="edit-profile-label">City</label>
                <ModernDropdown
                  value={city}
                  options={cityOptions}
                  onChange={setCity}
                  placeholder="Select city"
                />
              </div>
            </div>

            {/* 4. Details Row (2 col) */}
            <div className="edit-profile-full-width edit-profile-row-2col">
              <div className="min-w-0">
                <label className="edit-profile-label">Arena</label>
                <input
                  type="text"
                  className="auth-input"
                  value={arena}
                  onChange={e => setArena(e.target.value)}
                  placeholder="Enter arena name"
                />
              </div>
              <div className="min-w-0">
                <label className="edit-profile-label">Category</label>
                <ModernDropdown
                  value={category}
                  options={categoryOptions}
                  onChange={setCategory}
                  placeholder="Select category"
                />
              </div>
            </div>

            {/* 5. Organiser */}
            <div className="edit-profile-full-width">
              <label className="edit-profile-label">Organiser</label>
              <input
                type="text"
                className="auth-input"
                value={organiser}
                onChange={e => setOrganiser(e.target.value)}
                placeholder="Enter organiser name"
              />
            </div>

            {/* 6. Photographers assignment */}
            <div className="edit-profile-full-width border-t border-[var(--ui-bg-subtle)] pt-6 mt-2">
              <label className="edit-profile-label">Photographers</label>
              <MultiSelect
                values={selectedPhotographers}
                options={photographerOptions}
                onChange={setSelectedPhotographers}
                placeholder="Assign photographers"
              />
            </div>

            {/* 7. Applications */}
            <div className="edit-profile-full-width border-t border-[var(--ui-bg-subtle)] pt-6 mt-2">
              <Toggle
                label="Applications welcomed"
                checked={applicationsWelcomed}
                onChange={setApplicationsWelcomed}
              />
              <p className="mt-2 ml-14 text-[0.8125rem] leading-[1.4] text-secondary">
                If enabled, photographers can apply for this event.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer-actions">
          <button className="edit-profile-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="edit-profile-btn-save" onClick={handleDone}>
            {isEditMode ? 'Save' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
