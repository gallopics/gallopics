import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../components/Header';
import { User, Camera } from 'lucide-react';
import { useAuth, PROTOTYPE_USER } from '../../../context/AuthContext';

export const OnboardingProfile: React.FC = () => {
    const navigate = useNavigate();
    const { updateProfile } = useAuth();

    // State
    const [avatarUrl, setAvatarUrl] = useState<string | null>(PROTOTYPE_USER.avatarUrl);
    const [displayName, setDisplayName] = useState(PROTOTYPE_USER.displayName); // Prefilled from PROTOTYPE_USER
    const [country, setCountry] = useState(PROTOTYPE_USER.country);
    const [city, setCity] = useState(PROTOTYPE_USER.city);
    const [phoneCode, setPhoneCode] = useState('+46');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Mock Avatar Upload
    const handleAvatarUpload = () => {
        // In real app, this would trigger file input
        // For prototype, just set a dummy image
        setAvatarUrl('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');
    };

    const handleClearAvatar = () => {
        setAvatarUrl(null);
    };

    const handleContinue = () => {
        const newErrors: { [key: string]: string } = {};

        if (!displayName.trim()) newErrors.displayName = 'Display Name is required';
        if (!country.trim()) newErrors.country = 'Country is required';
        if (!city.trim()) newErrors.city = 'City is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Save to Global Store
        updateProfile({
            avatarUrl: avatarUrl || undefined, // undefined to ignore if null, or null is valid
            displayName,
            city,
            hasCompletedOnboarding: true
        });

        navigate('/pg/onboarding/ready');
    };

    const handleSkip = () => {
        // Save Defaults for Skipped Values to Global Store
        updateProfile({
            avatarUrl: avatarUrl || PROTOTYPE_USER.avatarUrl,
            displayName: displayName.trim() || PROTOTYPE_USER.displayName,
            city: city.trim() || PROTOTYPE_USER.city,
            hasCompletedOnboarding: true
        });

        navigate('/pg/onboarding/ready');
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Header />
            <div className="w-full max-w-[520px] mx-auto px-5 pt-[60px] pb-[60px]">
                <h1 className="text-primary text-[1.875rem] font-bold mb-[var(--spacing-xs)] text-center">Let's set up your profile</h1>
                <p className="text-secondary mb-[var(--spacing-xl)] text-center">Add a photo and your location so buyers know who you are.</p>

                <div className="card p-[var(--spacing-xl)]">

                    {/* 1. Avatar */}
                    <div className="flex items-center mb-[var(--spacing-xl)]">
                        <div
                            className="onboarding-avatar-circle flex-center flex-shrink-0 overflow-hidden relative"
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <div className="flex flex-col items-start gap-[var(--spacing-xs)]">
                            <button
                                onClick={handleAvatarUpload}
                                className="flex items-center gap-[6px] text-brand font-medium text-[length:var(--fs-base)]"
                            >
                                <Camera size={16} />
                                {avatarUrl ? 'Change photo' : 'Upload photo'}
                            </button>

                            {avatarUrl && (
                                <button
                                    onClick={handleClearAvatar}
                                    className="text-[var(--color-danger)] font-normal text-[length:var(--fs-sm)]"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. Display Name */}
                    <div className="auth-input-group mb-[var(--spacing-md)]">
                        <label className="auth-label" htmlFor="displayName">Display Name</label>
                        <input
                            id="displayName"
                            type="text"
                            className={`auth-input ${errors.displayName ? 'error' : ''}`}
                            value={displayName}
                            onChange={(e) => {
                                setDisplayName(e.target.value);
                                if (errors.displayName) setErrors({ ...errors, displayName: '' });
                            }}
                            placeholder={`e.g. ${PROTOTYPE_USER.displayName}`}
                        />
                        {errors.displayName && <span className="auth-error-msg">{errors.displayName}</span>}
                    </div>

                    {/* 3. Country */}
                    <div className="auth-input-group mb-[var(--spacing-md)]">
                        <label className="auth-label" htmlFor="country">Country</label>
                        <select
                            id="country"
                            className={`auth-select ${errors.country ? 'error' : ''}`}
                            value={country}
                            onChange={(e) => {
                                setCountry(e.target.value);
                                if (errors.country) setErrors({ ...errors, country: '' });
                            }}
                        >
                            <option value="Sweden">Sweden</option>
                            <option value="Norway">Norway</option>
                            <option value="Denmark">Denmark</option>
                            <option value="Finland">Finland</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Germany">Germany</option>
                        </select>
                        {errors.country && <span className="auth-error-msg">{errors.country}</span>}
                    </div>

                    {/* 4. City */}
                    <div className="auth-input-group mb-[var(--spacing-md)]">
                        <label className="auth-label" htmlFor="city">City</label>
                        <input
                            id="city"
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

                    {/* 5. Mobile Number */}
                    <div className="auth-input-group mb-[var(--spacing-xl)]">
                        <label className="auth-label" htmlFor="phone">Mobile Number (Optional)</label>
                        <div className="flex gap-[var(--spacing-sm)]">
                            <input
                                type="text"
                                className="auth-input text-center onboarding-phone-code"
                                value={phoneCode}
                                onChange={(e) => setPhoneCode(e.target.value)}
                            />
                            <input
                                id="phone"
                                type="tel"
                                className="auth-input flex-1"
                                placeholder="70 123 45 67"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CTAs */}
                    <button className="auth-btn-primary" onClick={handleContinue}>
                        Continue
                    </button>
                    <button
                        className="text-secondary w-full text-[length:var(--fs-sm)] mt-[var(--spacing-sm)] py-[var(--spacing-sm)] px-[var(--spacing-md)]"
                        onClick={handleSkip}
                    >
                        Skip for now
                    </button>

                </div>
            </div>
        </div>
    );
};
