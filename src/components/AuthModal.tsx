import React, { useEffect, useState } from 'react';
import { useClerk, useSignIn, useSignUp } from '@clerk/clerk-react';
import { X, Camera, Monitor, Link, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PROTOTYPE_USER } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'register';
  initialAccountType?: 'photographer' | 'buyer';
  onSwitchTab?: () => void;
}

interface ClerkFieldErrorState {
  identifier?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  form?: string;
}

interface ClerkDebugInfo {
  flow: 'sign_in' | 'sign_up';
  status?: string | null;
  details: string;
}

const routerBase =
  import.meta.env.BASE_URL === '/'
    ? ''
    : import.meta.env.BASE_URL.replace(/\/$/, '');

const buildAbsoluteUrl = (path: string) =>
  new URL(`${routerBase}${path}`, window.location.origin).toString();

const buildClerkMetadata = (overrides?: Record<string, unknown>) => ({
  approvalStatus: 'pending',
  hasCompletedOnboarding: false,
  role: 'pg',
  ...overrides,
});

const getClerkErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const maybeErrors = (
    error as { errors?: Array<{ longMessage?: string; message?: string }> }
  ).errors;
  if (Array.isArray(maybeErrors) && maybeErrors.length > 0) {
    return maybeErrors[0].longMessage ?? maybeErrors[0].message ?? fallback;
  }

  return fallback;
};

const stringifyClerkDebug = (value: unknown) => {
  try {
    return JSON.stringify(
      value,
      (_, currentValue) => {
        if (currentValue instanceof Error) {
          return {
            name: currentValue.name,
            message: currentValue.message,
            stack: currentValue.stack,
          };
        }

        if (typeof currentValue === 'function') {
          return `[function ${currentValue.name || 'anonymous'}]`;
        }

        return currentValue;
      },
      2
    );
  } catch {
    return String(value);
  }
};

const buildSignInDebugInfo = (result: unknown): ClerkDebugInfo => {
  const candidate = result as {
    status?: string;
    supportedFirstFactors?: unknown;
    supportedSecondFactors?: unknown;
    firstFactorVerification?: unknown;
    secondFactorVerification?: unknown;
    identifier?: unknown;
  };

  return {
    flow: 'sign_in',
    status: candidate?.status ?? null,
    details: stringifyClerkDebug({
      status: candidate?.status,
      identifier: candidate?.identifier,
      supportedFirstFactors: candidate?.supportedFirstFactors,
      supportedSecondFactors: candidate?.supportedSecondFactors,
      firstFactorVerification: candidate?.firstFactorVerification,
      secondFactorVerification: candidate?.secondFactorVerification,
      raw: candidate,
    }),
  };
};

const getOAuthCallbackUrl = () => buildAbsoluteUrl('/auth/callback');

const getPostSignInUrl = () => buildAbsoluteUrl('/pg');

const getPostSignUpUrl = () => buildAbsoluteUrl('/pg/onboarding/profile');

const getPostSignInRoute = (identifier: string) => {
  const normalized = identifier.trim().toLowerCase();

  if (normalized === 'member') {
    return `/photographer/${PROTOTYPE_USER.id}`;
  }

  if (normalized === 'admin' || normalized.startsWith('admin@')) {
    return '/admin/events';
  }

  return '/pg';
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'signin',
  initialAccountType = 'photographer',
  onSwitchTab,
}) => {
  const activeTab = initialTab;
  const [accountType, setAccountType] = useState<'photographer' | 'buyer'>(
    initialAccountType
  );
  const [isLoading, setIsLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [copied, setCopied] = useState(false);
  const isMobile = windowWidth < 768;
  const showMobilePhotographerView = accountType === 'photographer' && isMobile;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAccountType(initialAccountType);
      setIsLoading(false);
    }
  }, [isOpen, initialAccountType]);

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

  if (!isOpen) {
    return null;
  }

  const ctaLabel =
    activeTab === 'signin'
      ? isLoading
        ? 'Signing in...'
        : 'Sign in'
      : isLoading
      ? 'Creating account...'
      : 'Create account';

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="flex flex-col items-center gap-3 w-full max-w-[640px] px-4"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="auth-modal-container"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
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
                  For the best experience, please open Gallopics on a desktop or
                  laptop to upload and manage photos.
                </p>
                <div className="flex flex-col gap-[10px]">
                  <button className="auth-btn-primary m-0" onClick={onClose}>
                    Got it
                  </button>
                  <button
                    className={`auth-btn-oauth m-0 gap-1 ${
                      copied ? 'text-success' : ''
                    }`}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{
                      borderColor: copied
                        ? 'var(--color-success)'
                        : 'var(--color-border)',
                    }}
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
            ) : (
              <>
                {activeTab === 'register' && (
                  <div className="auth-account-type-wrapper">
                    <button
                      className={`auth-type-btn ${
                        accountType === 'photographer' ? 'active' : ''
                      }`}
                      onClick={() => setAccountType('photographer')}
                    >
                      <Camera size={16} />
                      <span>I'm a photographer</span>
                    </button>
                  </div>
                )}

                {activeTab === 'signin' ? (
                  <SignInForm
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    onClose={onClose}
                  />
                ) : (
                  <RegisterForm
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    onClose={onClose}
                  />
                )}
              </>
            )}
          </div>

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

              {activeTab === 'register' && (
                <p className="text-secondary text-xs leading-[1.4] text-center m-0">
                  By continuing, you agree to our{' '}
                  <a
                    href="#"
                    className="text-[var(--color-brand-primary)] underline"
                  >
                    Terms
                  </a>{' '}
                  and{' '}
                  <a
                    href="#"
                    className="text-[var(--color-brand-primary)] underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              )}

              {onSwitchTab && (
                <div className="flex items-center justify-center gap-1 pt-3 border-t border-[var(--color-border)]">
                  <span className="text-[0.8125rem] text-secondary">
                    {activeTab === 'signin'
                      ? 'New user?'
                      : 'Already registered?'}
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
      </div>
    </div>
  );
};

interface FormProps {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  onClose: () => void;
}

const SignInForm: React.FC<FormProps> = ({
  isLoading,
  setIsLoading,
  onClose,
}) => {
  const navigate = useNavigate();
  const clerk = useClerk();
  const { isLoaded, signIn } = useSignIn();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState<ClerkFieldErrorState>({});

  const validate = () => {
    const nextErrors: ClerkFieldErrorState = {};

    if (!formData.identifier.trim()) {
      nextErrors.identifier = 'Username is required';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const result = await signIn.create({
        identifier: formData.identifier,
        password: formData.password,
      });

      const nextDebugInfo = buildSignInDebugInfo(result);
      console.error('Clerk sign-in result', result);

      if (result.status === 'complete' && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId });
        onClose();
        navigate(getPostSignInRoute(formData.identifier));
        return;
      }

      setErrors({
        form:
          nextDebugInfo.status === 'needs_second_factor'
            ? 'This account needs an additional verification step before it can sign in.'
            : '',
      });
    } catch (error) {
      console.error('Clerk sign-in error', error);
      setErrors({
        form: getClerkErrorMessage(
          error,
          'Unable to sign in with those credentials.'
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: getOAuthCallbackUrl(),
        redirectUrlComplete: getPostSignInUrl(),
      });
    } catch (error) {
      console.error('Clerk OAuth sign-in error', error);
      setErrors({
        form: getClerkErrorMessage(error, 'Unable to start social sign-in.'),
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-oauth-group">
        <button
          className="auth-btn-oauth"
          type="button"
          onClick={() => startOAuth('oauth_google')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        <button
          className="auth-btn-oauth"
          type="button"
          onClick={() => startOAuth('oauth_apple')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.77.56 3.48 1.54-3.22 1.66-2.69 5.8 1.25 7.45-.63 1.75-1.61 3.16-3.32 4.04zM12.03 7.25c-.25-2.19 1.62-4.04 3.55-4.25.29 2.58-2.63 4.41-3.55 4.25z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <div className="auth-divider">or</div>

      <form id="auth-main-form" className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="signin-identifier">
            Username
          </label>
          <input
            id="signin-identifier"
            type="text"
            className={`auth-input ${errors.identifier ? 'error' : ''}`}
            placeholder="Enter your username"
            value={formData.identifier}
            onChange={e => {
              setFormData({ ...formData, identifier: e.target.value });
              setErrors(current => ({
                ...current,
                identifier: undefined,
                form: undefined,
              }));
            }}
            disabled={isLoading}
          />
          {errors.identifier && (
            <span className="auth-error-msg">{errors.identifier}</span>
          )}
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="signin-password">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            className={`auth-input ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            value={formData.password}
            onChange={e => {
              setFormData({ ...formData, password: e.target.value });
              setErrors(current => ({
                ...current,
                password: undefined,
                form: undefined,
              }));
            }}
            disabled={isLoading}
          />
          {errors.password && (
            <span className="auth-error-msg">{errors.password}</span>
          )}
        </div>

        {errors.form && <span className="auth-error-msg">{errors.form}</span>}
        <a href="#" className="auth-helper-link">
          Forgot password?
        </a>
      </form>
    </div>
  );
};

const RegisterForm: React.FC<FormProps> = ({
  isLoading,
  setIsLoading,
  onClose,
}) => {
  const navigate = useNavigate();
  const clerk = useClerk();
  const { isLoaded, signUp } = useSignUp();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ClerkFieldErrorState>({});

  useEffect(() => {
    setErrors({});
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
  }, []);

  const validateDetails = () => {
    const nextErrors: ClerkFieldErrorState = {};

    if (!formData.firstName) {
      nextErrors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      nextErrors.lastName = 'Last name is required';
    }

    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9._-]{3,32}$/.test(formData.username.trim())) {
      nextErrors.username =
        'Use 3-32 letters, numbers, dots, dashes, or underscores';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateDetails() || !isLoaded) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username.trim(),
        password: formData.password,
        unsafeMetadata: buildClerkMetadata(),
      });

      console.error('Clerk sign-up result', result);

      if (result.status === 'complete' && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId });
        onClose();
        navigate('/pg/onboarding/profile');
        return;
      }

      setErrors({
        form: 'Clerk requires additional sign-up steps for this instance. Update Clerk sign-up settings if username-only sign-up is intended.',
      });
    } catch (error) {
      console.error('Clerk sign-up error', error);
      setErrors({
        form: getClerkErrorMessage(
          error,
          'Unable to create your account right now.'
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateAccount();
  };

  const startOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: getOAuthCallbackUrl(),
        redirectUrlComplete: getPostSignUpUrl(),
        unsafeMetadata: buildClerkMetadata(),
      });
    } catch (error) {
      console.error('Clerk OAuth sign-up error', error);
      setErrors({
        form: getClerkErrorMessage(error, 'Unable to start social sign-up.'),
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-oauth-group">
        <button
          className="auth-btn-oauth"
          type="button"
          onClick={() => startOAuth('oauth_google')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        <button
          className="auth-btn-oauth"
          type="button"
          onClick={() => startOAuth('oauth_apple')}
        >
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
            <label className="auth-label" htmlFor="reg-fname">
              First Name
            </label>
            <input
              id="reg-fname"
              type="text"
              className={`auth-input ${errors.firstName ? 'error' : ''}`}
              placeholder="Given Name"
              value={formData.firstName}
              onChange={e => {
                setFormData({ ...formData, firstName: e.target.value });
                setErrors(current => ({
                  ...current,
                  firstName: undefined,
                  form: undefined,
                }));
              }}
              disabled={isLoading}
            />
            {errors.firstName && (
              <span className="auth-error-msg">{errors.firstName}</span>
            )}
          </div>
          <div className="auth-input-group flex-1">
            <label className="auth-label" htmlFor="reg-lname">
              Last Name
            </label>
            <input
              id="reg-lname"
              type="text"
              className={`auth-input ${errors.lastName ? 'error' : ''}`}
              placeholder="Family Name"
              value={formData.lastName}
              onChange={e => {
                setFormData({ ...formData, lastName: e.target.value });
                setErrors(current => ({
                  ...current,
                  lastName: undefined,
                  form: undefined,
                }));
              }}
              disabled={isLoading}
            />
            {errors.lastName && (
              <span className="auth-error-msg">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="reg-username">
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            className={`auth-input ${errors.username ? 'error' : ''}`}
            placeholder="Choose a username"
            value={formData.username}
            onChange={e => {
              setFormData({ ...formData, username: e.target.value });
              setErrors(current => ({
                ...current,
                username: undefined,
                form: undefined,
              }));
            }}
            disabled={isLoading}
          />
          {errors.username && (
            <span className="auth-error-msg">{errors.username}</span>
          )}
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            className={`auth-input ${errors.password ? 'error' : ''}`}
            placeholder="Min 8 chars"
            value={formData.password}
            onChange={e => {
              setFormData({ ...formData, password: e.target.value });
              setErrors(current => ({
                ...current,
                password: undefined,
                form: undefined,
              }));
            }}
            disabled={isLoading}
          />
          {errors.password && (
            <span className="auth-error-msg">{errors.password}</span>
          )}
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="reg-confirm">
            Confirm Password
          </label>
          <input
            id="reg-confirm"
            type="password"
            className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={e => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              setErrors(current => ({
                ...current,
                confirmPassword: undefined,
                form: undefined,
              }));
            }}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <span className="auth-error-msg">{errors.confirmPassword}</span>
          )}
        </div>

        {errors.form && <span className="auth-error-msg">{errors.form}</span>}
      </form>
    </div>
  );
};
