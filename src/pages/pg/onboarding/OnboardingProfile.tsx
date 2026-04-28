import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../components/Header';
import { User, Camera } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { resolveApiAssetUrl } from '../../../data/apiClient';

export const OnboardingProfile: React.FC = () => {
  const navigate = useNavigate();
  const { updateProfile, uploadAvatar, user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl ?? null,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(
    user?.displayName ?? '',
  );
  const [country, setCountry] = useState(
    user?.country ?? 'Sweden',
  );
  const [city, setCity] = useState(user?.city ?? '');
  const [phoneCode, setPhoneCode] = useState('+46');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setErrors(current => ({ ...current, avatar: '' }));

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setAvatarUrl(null);
    e.target.value = '';
  };

  const handleClearAvatar = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarUrl(null);
  };

  const saveProfile = async (hasCompletedOnboarding: boolean) => {
    setIsSaving(true);
    setErrors(current => ({ ...current, avatar: '' }));

    try {
      await updateProfile({
        avatarUrl: avatarFile ? undefined : avatarUrl,
        displayName: displayName.trim() || user?.displayName || 'Photographer',
        country: country.trim() || user?.country || '',
        city: city.trim() || user?.city || '',
        phone: phoneNumber.trim() ? `${phoneCode}${phoneNumber.trim()}` : null,
        hasCompletedOnboarding,
      });

      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }

      navigate('/pg/onboarding/ready');
    } catch (error) {
      console.error('Failed to save profile', error);
      setErrors(current => ({
        ...current,
        avatar: avatarFile
          ? 'Unable to upload photo. Please try another image.'
          : current.avatar,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!displayName.trim()) newErrors.displayName = 'Display Name is required';
    if (!country.trim()) newErrors.country = 'Country is required';
    if (!city.trim()) newErrors.city = 'City is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await saveProfile(true);
  };

  const handleSkip = async () => {
    await saveProfile(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <div className="w-full max-w-[520px] mx-auto px-5 pt-[60px] pb-[60px]">
        <h1 className="text-primary text-[1.875rem] font-bold mb-[var(--spacing-xs)] text-center">
          Let's set up your profile
        </h1>
        <p className="text-secondary mb-[var(--spacing-xl)] text-center">
          Add a photo and your location so buyers know who you are.
        </p>

        <div className="card p-[var(--spacing-xl)]">
          {/* 1. Avatar */}
          <div className="flex items-center mb-[var(--spacing-xl)]">
            <div className="onboarding-avatar-circle flex-center flex-shrink-0 overflow-hidden relative">
              {avatarPreviewUrl || avatarUrl ? (
                <img
                  src={
                    avatarPreviewUrl ??
                    resolveApiAssetUrl(avatarUrl) ??
                    undefined
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="flex flex-col items-start gap-[var(--spacing-xs)]">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <button
                onClick={handleAvatarUpload}
                className="flex items-center gap-[6px] text-brand font-medium text-[length:var(--fs-base)]"
                disabled={isSaving}
              >
                <Camera size={16} />
                {isSaving
                  ? 'Saving...'
                  : avatarPreviewUrl || avatarUrl
                    ? 'Change photo'
                    : 'Upload photo'}
              </button>

              {(avatarPreviewUrl || avatarUrl) && (
                <button
                  onClick={handleClearAvatar}
                  className="text-[var(--color-danger)] font-normal text-[length:var(--fs-sm)]"
                  disabled={isSaving}
                >
                  Remove
                </button>
              )}
              {errors.avatar && (
                <span className="auth-error-msg">{errors.avatar}</span>
              )}
            </div>
          </div>

          {/* 2. Display Name */}
          <div className="auth-input-group mb-[var(--spacing-md)]">
            <label className="auth-label" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              className={`auth-input ${errors.displayName ? 'error' : ''}`}
              value={displayName}
              onChange={e => {
                setDisplayName(e.target.value);
                if (errors.displayName)
                  setErrors({ ...errors, displayName: '' });
              }}
              placeholder="e.g. Klara Fors"
            />
            {errors.displayName && (
              <span className="auth-error-msg">{errors.displayName}</span>
            )}
          </div>

          {/* 3. Country */}
          <div className="auth-input-group mb-[var(--spacing-md)]">
            <label className="auth-label" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              className={`auth-select ${errors.country ? 'error' : ''}`}
              value={country}
              onChange={e => {
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
            {errors.country && (
              <span className="auth-error-msg">{errors.country}</span>
            )}
          </div>

          {/* 4. City */}
          <div className="auth-input-group mb-[var(--spacing-md)]">
            <label className="auth-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              type="text"
              className={`auth-input ${errors.city ? 'error' : ''}`}
              value={city}
              onChange={e => {
                setCity(e.target.value);
                if (errors.city) setErrors({ ...errors, city: '' });
              }}
              placeholder="e.g. Stockholm"
            />
            {errors.city && (
              <span className="auth-error-msg">{errors.city}</span>
            )}
          </div>

          {/* 5. Mobile Number */}
          <div className="auth-input-group mb-[var(--spacing-xl)]">
            <label className="auth-label" htmlFor="phone">
              Mobile Number (Optional)
            </label>
            <div className="flex gap-[var(--spacing-sm)]">
              <input
                type="text"
                className="auth-input text-center onboarding-phone-code"
                value={phoneCode}
                onChange={e => setPhoneCode(e.target.value)}
              />
              <input
                id="phone"
                type="tel"
                className="auth-input flex-1"
                placeholder="70 123 45 67"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          {/* CTAs */}
          <button
            className="auth-btn-primary"
            onClick={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Continue'}
          </button>
          <button
            className="text-secondary w-full text-[length:var(--fs-sm)] mt-[var(--spacing-sm)] py-[var(--spacing-sm)] px-[var(--spacing-md)]"
            onClick={handleSkip}
            disabled={isSaving}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
