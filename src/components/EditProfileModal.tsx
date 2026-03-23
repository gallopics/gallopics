import React, { useState, useEffect } from 'react';
import { X, Camera, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ModernDropdown } from './ModernDropdown';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [country, setCountry] = useState('Sweden');
    const [city, setCity] = useState('');
    const [phoneCode, setPhoneCode] = useState('+46');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const countryOptions = [
        { label: 'Sweden', value: 'Sweden', icon: '🇸🇪' },
        { label: 'Norway', value: 'Norway', icon: '🇳🇴' },
        { label: 'Denmark', value: 'Denmark', icon: '🇩🇰' },
        { label: 'Finland', value: 'Finland', icon: '🇫🇮' },
        { label: 'United States', value: 'United States', icon: '🇺🇸' },
        { label: 'United Kingdom', value: 'United Kingdom', icon: '🇬🇧' },
        { label: 'Germany', value: 'Germany', icon: '🇩🇪' },
    ];

    const phoneCodeOptions = [
        { label: '+46', value: '+46' },
        { label: '+45', value: '+45' },
        { label: '+47', value: '+47' },
        { label: '+358', value: '+358' },
        { label: '+1', value: '+1' },
        { label: '+44', value: '+44' },
    ];

    useEffect(() => {
        if (isOpen && user) {
            setAvatarUrl(user.avatarUrl || null);
            setDisplayName(user.displayName || '');
            setCountry('Sweden');
            setCity(user.city || '');
            setErrors({});
        }
    }, [isOpen, user]);

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

    const handleAvatarUpload = () => {
        setAvatarUrl('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');
    };

    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};
        if (!displayName.trim()) newErrors.displayName = 'Display Name is required';
        if (!country.trim()) newErrors.country = 'Country is required';
        if (!city.trim()) newErrors.city = 'City is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        updateProfile({ avatarUrl: avatarUrl || undefined, displayName, city });
        onClose();
    };

    return (
        <div className="auth-modal-overlay z-[1100] items-center" onClick={onClose}>
            <div
                className="edit-profile-modal-container"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="modal-header-standard">
                    <h2 className="modal-title">Edit Profile</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body-standard">

                    {/* Avatar */}
                    <div className="flex items-center gap-5 pb-[var(--modal-padding)] mb-[var(--modal-padding)] border-b border-[var(--color-border)]">
                        <div className="w-14 h-14 rounded-full bg-[var(--ui-bg-subtle)] overflow-hidden flex items-center justify-center text-[var(--color-text-secondary)] border border-[var(--color-border)] flex-shrink-0">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} />
                            )}
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <button
                                className="text-[var(--color-brand-primary)] font-medium bg-transparent border-none cursor-pointer p-0 text-[0.875rem] flex items-center gap-1.5"
                                onClick={handleAvatarUpload}
                            >
                                <Camera size={16} />
                                {avatarUrl ? 'Change photo' : 'Upload photo'}
                            </button>
                            {avatarUrl && (
                                <button
                                    className="text-[var(--color-danger)] font-normal bg-transparent border-none cursor-pointer p-0 text-[0.8125rem]"
                                    onClick={() => setAvatarUrl(null)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">

                        <div className="col-span-full">
                            <label className="modal-label">Display Name</label>
                            <input
                                type="text"
                                className={`auth-input ${errors.displayName ? 'error' : ''}`}
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value);
                                    if (errors.displayName) setErrors({ ...errors, displayName: '' });
                                }}
                                placeholder="e.g. Klara Fors"
                            />
                            {errors.displayName && <span className="auth-error-msg">{errors.displayName}</span>}
                        </div>

                        <div className="col-span-full grid grid-cols-2 gap-4 w-full max-[600px]:grid-cols-1">
                            <div>
                                <label className="modal-label">Country</label>
                                <ModernDropdown value={country} options={countryOptions} onChange={setCountry} />
                            </div>
                            <div>
                                <label className="modal-label">City</label>
                                <input
                                    type="text"
                                    className={`auth-input ${errors.city ? 'error' : ''}`}
                                    value={city}
                                    onChange={(e) => {
                                        setCity(e.target.value);
                                        if (errors.city) setErrors({ ...errors, city: '' });
                                    }}
                                    placeholder="e.g. Stockholm"
                                />
                                {errors.city && <span className="auth-error-msg">{errors.city}</span>}
                            </div>
                        </div>

                        <div className="col-span-full grid gap-4 w-full max-[600px]:grid-cols-1 [grid-template-columns:100px_1fr]">
                            <div>
                                <label className="modal-label">Code</label>
                                <ModernDropdown value={phoneCode} options={phoneCodeOptions} onChange={setPhoneCode} />
                            </div>
                            <div>
                                <label className="modal-label">Mobile Number (Optional)</label>
                                <input
                                    type="tel"
                                    className="auth-input w-full"
                                    placeholder="70 123 45 67"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer-actions">
                    <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="modal-btn-save" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};
