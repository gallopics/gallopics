import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Lock, Monitor, Link, Check } from 'lucide-react';
import { useAuth, PROTOTYPE_USER, ADMIN_USER } from '../context/AuthContext';

const PROTOTYPE_MODE = true;

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'signin' | 'register';
    initialAccountType?: 'photographer' | 'buyer';
    onSwitchTab?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    initialTab = 'signin',
    initialAccountType = 'photographer',
    onSwitchTab,
}) => {
    const activeTab = initialTab;
    const [accountType, setAccountType] = useState<'photographer' | 'buyer'>(initialAccountType);
    const [isLoading, setIsLoading] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [copied, setCopied] = useState(false);
    const isMobile = windowWidth < 768;
    const showMobilePhotographerView = accountType === 'photographer' && isMobile;

    const navigate = useNavigate();
    const { login } = useAuth();

    // Window Resize Effect
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync account type when modal opens
    useEffect(() => {
        if (isOpen) {
            setAccountType(initialAccountType);
            setIsLoading(false);
        }
    }, [isOpen, initialAccountType]);

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

    const ctaLabel = activeTab === 'signin'
        ? (isLoading ? 'Signing in...' : 'Sign in')
        : (isLoading ? 'Creating account...' : 'Create account');

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="flex flex-col items-center gap-3 w-full max-w-[640px] px-4" onClick={(e) => e.stopPropagation()}>
            <div
                className="auth-modal-container"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Sticky Header */}
                <div className="px-[var(--modal-padding)] py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white flex-shrink-0">
                    <h2 className="text-[1.125rem] font-semibold text-primary m-0">
                        {activeTab === 'signin' ? 'Sign in' : 'Create account'}
                    </h2>
                    <button
                        className="w-8 h-8 rounded-full border-none bg-transparent flex items-center justify-center text-secondary cursor-pointer transition-all duration-200 hover:bg-black/[0.04] hover:text-primary"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-[var(--modal-padding)] overflow-y-auto flex-1">
                    {showMobilePhotographerView ? (
                        <div className="text-center px-1 py-6">
                            <div className="flex-center mx-auto text-brand auth-desktop-icon">
                                <Monitor size={28} />
                            </div>
                            <h2 className="text-primary text-base font-semibold mb-[10px]">
                                Use a desktop for photographer tools
                            </h2>
                            <p className="text-secondary leading-[1.5] mb-6 text-sm">
                                For the best experience, please open Gallopics on a desktop or laptop to upload and manage photos.
                            </p>
                            <div className="flex flex-col gap-[10px]">
                                <button className="auth-btn-primary m-0" onClick={onClose}>
                                    Got it
                                </button>
                                <button
                                    className={`auth-btn-oauth m-0 gap-1 ${copied ? 'text-success' : ''}`}
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    style={{ borderColor: copied ? 'var(--color-success)' : 'var(--color-border)' }}
                                >
                                    {copied ? (
                                        <><Check size={16} /> Copied!</>
                                    ) : (
                                        <><Link size={16} /> Copy link</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Account type picker — register only */}
                            {activeTab === 'register' && (
                                <div className="auth-account-type-wrapper">
                                    <button
                                        className={`auth-type-btn ${accountType === 'photographer' ? 'active' : ''}`}
                                        onClick={() => setAccountType('photographer')}
                                    >
                                        <Camera size={16} />
                                        <span>I'm a photographer</span>
                                    </button>
                                    <button
                                        className={`auth-type-btn ${accountType === 'buyer' ? 'active' : ''} disabled`}
                                        onClick={() => { }}
                                        disabled
                                        title="Buyer accounts coming soon"
                                    >
                                        <Lock size={14} />
                                        <span>I'm a buyer</span>
                                    </button>
                                </div>
                            )}

                            {activeTab === 'signin'
                                ? <SignInForm isLoading={isLoading} setIsLoading={setIsLoading} onClose={onClose} navigate={navigate} login={login} />
                                : <RegisterForm isLoading={isLoading} setIsLoading={setIsLoading} onClose={onClose} navigate={navigate} login={login} />
                            }
                        </>
                    )}
                </div>

                {/* Sticky Footer — hidden for mobile photographer view */}
                {!showMobilePhotographerView && (
                    <div className="px-[var(--modal-padding)] pt-4 pb-6 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0 flex flex-col gap-4">
                        <div className="w-full flex gap-3">
                            <button
                                type="button"
                                className="modal-btn-cancel flex-1"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="auth-main-form"
                                className="auth-btn-primary flex-[2] mt-0 h-11 w-auto px-6"
                                disabled={isLoading}
                            >
                                {ctaLabel}
                            </button>
                        </div>

                        {/* Terms — register only */}
                        {activeTab === 'register' && (
                            <p className="text-secondary text-xs leading-[1.4] text-center m-0">
                                By continuing, you agree to our{' '}
                                <a href="#" className="text-[var(--color-brand-primary)] underline">Terms</a>{' '}
                                and{' '}
                                <a href="#" className="text-[var(--color-brand-primary)] underline">Privacy Policy</a>.
                            </p>
                        )}

                        {/* Switch link */}
                        {onSwitchTab && (
                            <div className="flex items-center justify-center gap-1 pt-3 border-t border-[var(--color-border)]">
                                <span className="text-[0.8125rem] text-secondary">
                                    {activeTab === 'signin' ? 'New user?' : 'Already registered?'}
                                </span>
                                <button
                                    type="button"
                                    className="text-[0.8125rem] font-semibold text-[var(--color-brand-primary)] bg-transparent border-none cursor-pointer p-0 hover:underline"
                                    onClick={onSwitchTab}
                                >
                                    {activeTab === 'signin' ? 'Register here' : 'Sign in now'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Demo-only admin shortcut — outside modal, white text */}
            <button
                onClick={() => {
                    login({ ...ADMIN_USER, hasCompletedOnboarding: true });
                    onClose();
                    navigate('/admin/events');
                }}
                className="text-white/60 text-sm font-semibold cursor-pointer p-0 bg-transparent border-none hover:text-white transition-colors"
            >
                I am Admin
            </button>
            </div>
        </div>
    );
};

// ─── Sign In Form ────────────────────────────────────────────────────────────

interface FormProps {
    isLoading: boolean;
    setIsLoading: (v: boolean) => void;
    onClose: () => void;
    navigate: ReturnType<typeof useNavigate>;
    login: ReturnType<typeof useAuth>['login'];
}

const SignInForm: React.FC<FormProps> = ({ isLoading, setIsLoading, navigate, login }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (PROTOTYPE_MODE) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                login({ ...PROTOTYPE_USER, hasCompletedOnboarding: true });
                navigate('/pg');
            }, 800);
            return;
        }

        if (!validate()) return;

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            login({ ...PROTOTYPE_USER, hasCompletedOnboarding: true });
            navigate('/pg');
        }, 1500);
    };

    return (
        <div className="auth-form-wrapper">
            <div className="auth-oauth-group">
                <button
                    className="auth-btn-oauth"
                    type="button"
                    onClick={() => {
                        login({ ...PROTOTYPE_USER, hasCompletedOnboarding: true });
                        navigate('/pg');
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
                <button className="auth-btn-oauth" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.77.56 3.48 1.54-3.22 1.66-2.69 5.8 1.25 7.45-.63 1.75-1.61 3.16-3.32 4.04zM12.03 7.25c-.25-2.19 1.62-4.04 3.55-4.25.29 2.58-2.63 4.41-3.55 4.25z" />
                    </svg>
                    Continue with Apple
                </button>
            </div>

            <div className="auth-divider">or</div>

            <form id="auth-main-form" className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-input-group">
                    <label className="auth-label" htmlFor="signin-email">Email</label>
                    <input
                        id="signin-email"
                        type="email"
                        className={`auth-input ${errors.email ? 'error' : ''}`}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        disabled={isLoading}
                    />
                    {errors.email && <span className="auth-error-msg">{errors.email}</span>}
                </div>

                <div className="auth-input-group">
                    <label className="auth-label" htmlFor="signin-password">Password</label>
                    <input
                        id="signin-password"
                        type="password"
                        className={`auth-input ${errors.password ? 'error' : ''}`}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        disabled={isLoading}
                    />
                    {errors.password && <span className="auth-error-msg">{errors.password}</span>}
                </div>

                <a href="#" className="auth-helper-link">Forgot password?</a>
            </form>
        </div>
    );
};

// ─── Register Form ───────────────────────────────────────────────────────────

const RegisterForm: React.FC<FormProps> = ({ isLoading, setIsLoading, navigate, login }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (PROTOTYPE_MODE) {
            setIsLoading(true);
            setTimeout(() => {
                setIsLoading(false);
                login({
                    displayName: formData.firstName ? `${formData.firstName} ${formData.lastName}` : PROTOTYPE_USER.displayName,
                    city: PROTOTYPE_USER.city,
                    avatarUrl: PROTOTYPE_USER.avatarUrl,
                    hasCompletedOnboarding: false
                });
                navigate('/pg/onboarding/profile');
            }, 800);
            return;
        }

        if (!validate()) return;

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            login({
                displayName: `${formData.firstName} ${formData.lastName}`,
                city: PROTOTYPE_USER.city,
                avatarUrl: PROTOTYPE_USER.avatarUrl,
                hasCompletedOnboarding: false
            });
            navigate('/pg/onboarding/profile');
        }, 1500);
    };

    return (
        <div className="auth-form-wrapper">
            <div className="auth-oauth-group">
                <button
                    className="auth-btn-oauth"
                    type="button"
                    onClick={() => {
                        login({ displayName: 'Google User', city: '', hasCompletedOnboarding: false });
                        navigate('/pg/onboarding/profile');
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
                <button className="auth-btn-oauth" type="button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.77.56 3.48 1.54-3.22 1.66-2.69 5.8 1.25 7.45-.63 1.75-1.61 3.16-3.32 4.04zM12.03 7.25c-.25-2.19 1.62-4.04 3.55-4.25.29 2.58-2.63 4.41-3.55 4.25z" />
                    </svg>
                    Continue with Apple
                </button>
            </div>

            <div className="auth-divider">or</div>

            <form id="auth-main-form" className="auth-form" onSubmit={handleSubmit}>
                <div className="flex gap-4">
                    <div className="auth-input-group flex-1">
                        <label className="auth-label" htmlFor="reg-fname">First Name</label>
                        <input
                            id="reg-fname"
                            type="text"
                            className={`auth-input ${errors.firstName ? 'error' : ''}`}
                            placeholder="Given Name"
                            value={formData.firstName}
                            onChange={(e) => {
                                setFormData({ ...formData, firstName: e.target.value });
                                if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                            }}
                            disabled={isLoading}
                        />
                        {errors.firstName && <span className="auth-error-msg">{errors.firstName}</span>}
                    </div>
                    <div className="auth-input-group flex-1">
                        <label className="auth-label" htmlFor="reg-lname">Last Name</label>
                        <input
                            id="reg-lname"
                            type="text"
                            className={`auth-input ${errors.lastName ? 'error' : ''}`}
                            placeholder="Family Name"
                            value={formData.lastName}
                            onChange={(e) => {
                                setFormData({ ...formData, lastName: e.target.value });
                                if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                            }}
                            disabled={isLoading}
                        />
                        {errors.lastName && <span className="auth-error-msg">{errors.lastName}</span>}
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email"
                        type="email"
                        className={`auth-input ${errors.email ? 'error' : ''}`}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        disabled={isLoading}
                    />
                    {errors.email && <span className="auth-error-msg">{errors.email}</span>}
                </div>

                <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-password">Password</label>
                    <input
                        id="reg-password"
                        type="password"
                        className={`auth-input ${errors.password ? 'error' : ''}`}
                        placeholder="Min 8 chars"
                        value={formData.password}
                        onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        disabled={isLoading}
                    />
                    {errors.password && <span className="auth-error-msg">{errors.password}</span>}
                </div>

                <div className="auth-input-group">
                    <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
                    <input
                        id="reg-confirm"
                        type="password"
                        className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        disabled={isLoading}
                    />
                    {errors.confirmPassword && <span className="auth-error-msg">{errors.confirmPassword}</span>}
                </div>
            </form>
        </div>
    );
};
