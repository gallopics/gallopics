import React, { useState } from 'react';
import {
  Check,
  Zap,
  CreditCard,
  Smartphone,
  SmartphoneNfc,
} from 'lucide-react';

interface CheckoutPanelProps {
  total: number;
  onPay?: (email: string, method: string) => void;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  total,
  onPay,
}) => {
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('swish');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verify' | 'verified'>('input');
  const [countdown, setCountdown] = useState(0);

  const [secretCode, setSecretCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Check storage for verified email
  React.useEffect(() => {
    const saved =
      sessionStorage.getItem('gallopics_verified_email') ||
      localStorage.getItem('gallopics_verified_email');
    if (saved) {
      setEmail(saved);
      setStep('verified');
    }
  }, []);

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSecretCode(code);
    console.log('Gallopics Mock OTP:', code); // For demo purposes
    return code;
  };

  const handleSendCode = () => {
    if (!email) return;
    generateCode();
    setStep('verify');
    setCountdown(30);
    setAttempts(0);
    setOtpError(null);
  };

  const handleVerify = () => {
    if (attempts >= 5) {
      setOtpError('Too many failed attempts. Please resend code.');
      return;
    }

    if (otp === secretCode || otp === '123456') {
      // Allow 123456 as easy fallback
      setStep('verified');
      setOtpError(null);
      // Save to storage
      sessionStorage.setItem('gallopics_verified_email', email);
      localStorage.setItem('gallopics_verified_email', email);
    } else {
      setAttempts(prev => prev + 1);
      setOtpError('Incorrect code. Try again.');
    }
  };

  const handleChangeEmail = () => {
    setStep('input');
    setOtp('');
    setOtpError(null);
    setAttempts(0);
  };

  const handleClearVerified = () => {
    setStep('input');
    setEmail('');
    setOtp('');
    sessionStorage.removeItem('gallopics_verified_email');
    localStorage.removeItem('gallopics_verified_email');
  };

  const handleResend = () => {
    generateCode();
    setCountdown(30);
    setAttempts(0);
    setOtpError(null);
  };

  // Countdown effect
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onPay) {
      onPay(email, paymentMethod);
    } else {
      alert(
        `Processing ${paymentMethod} payment for ${total} SEK\nReceipt sent to: ${email}`,
      );
    }
  };

  const isVerified = step === 'verified';

  // Shared input class
  const emailInputClass =
    'w-full px-[var(--spacing-md)] py-[var(--spacing-md)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-base transition-all duration-200 ease-linear bg-[var(--color-surface)] outline-none focus:border-black focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,0,0,0.05)] disabled:bg-[var(--color-bg)] disabled:text-[var(--color-text-secondary)] disabled:border-transparent';

  return (
    <div className="bg-white">
      <h3 className="text-[1.25rem] font-bold mb-6 text-[var(--color-text-primary)]">
        Checkout
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="form-group">
          <label htmlFor="email">Email verification</label>
          <div className="flex flex-col gap-4">
            {step === 'input' && (
              <div className="flex gap-3">
                <input
                  type="email"
                  id="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={emailInputClass}
                />
                <button
                  type="button"
                  className="px-4 bg-[var(--color-brand-primary)] text-white border-none rounded-[var(--radius-full)] font-semibold text-[0.875rem] cursor-pointer whitespace-nowrap transition-all duration-200 ease-linear disabled:bg-[var(--ui-bg-subtle)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed hover:not-disabled:bg-[var(--color-brand-primary-hover)] hover:not-disabled:-translate-y-px"
                  onClick={handleSendCode}
                  disabled={!email.includes('@')}
                >
                  Send code
                </button>
              </div>
            )}

            {step === 'verify' && (
              <div className="verify-step">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    maxLength={6}
                    className={emailInputClass}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="px-4 bg-[var(--color-brand-primary)] text-white border-none rounded-[var(--radius-full)] font-semibold text-[0.875rem] cursor-pointer whitespace-nowrap transition-all duration-200 ease-linear disabled:bg-[var(--ui-bg-subtle)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed hover:not-disabled:bg-[var(--color-brand-primary-hover)] hover:not-disabled:-translate-y-px"
                    onClick={handleVerify}
                    disabled={otp.length !== 6}
                  >
                    Verify
                  </button>
                </div>
                <div className="flex justify-between items-center text-[0.75rem] mt-2">
                  <button
                    type="button"
                    className="bg-none border-none p-0 text-[var(--color-text-secondary)] font-medium cursor-pointer underline transition-[color] duration-200 disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:no-underline hover:text-[var(--color-text-primary)]"
                    onClick={handleResend}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    className="bg-none border-none p-0 text-[var(--color-text-secondary)] font-medium cursor-pointer underline transition-[color] duration-200 hover:text-[var(--color-text-primary)]"
                    onClick={handleChangeEmail}
                  >
                    Change email
                  </button>
                </div>
                {otpError ? (
                  <p className="text-[0.75rem] text-[var(--color-danger)] mt-[6px] font-medium">
                    {otpError}
                  </p>
                ) : (
                  <p className="text-[0.75rem] text-[var(--color-text-secondary)] mt-[6px]">
                    Enter the code sent to {email}. Code expires in 10 minutes.
                  </p>
                )}
              </div>
            )}

            {step === 'verified' && (
              <div className="relative">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    disabled
                    className={`${emailInputClass} verified`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[6px] text-[var(--color-success)] font-semibold text-[0.875rem] pointer-events-none">
                    Verified <Check size={14} />
                  </div>
                </div>
                <div className="flex justify-end items-center text-[0.75rem] mt-2">
                  <button
                    type="button"
                    className="bg-none border-none p-0 text-[var(--color-text-secondary)] font-medium cursor-pointer underline transition-[color] duration-200 hover:text-[var(--color-text-primary)]"
                    onClick={handleClearVerified}
                  >
                    Not you?
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`payment-methods ${!isVerified ? 'disabled-section opacity-50 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
        >
          <label className="block text-[0.875rem] font-semibold mb-3">
            Select payment method
          </label>

          <div className="flex flex-col gap-[10px]">
            {/* Swish */}
            <label className={`relative cursor-pointer`}>
              <input
                type="radio"
                name="payment"
                value="swish"
                checked={paymentMethod === 'swish'}
                onChange={() => setPaymentMethod('swish')}
                className="absolute opacity-0"
              />
              <div
                className={`flex items-center gap-4 py-[14px] px-4 border border-[var(--color-border)] rounded-[var(--radius-md)] transition-all duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] bg-white hover:border-[var(--color-border)] hover:bg-[var(--ui-bg-subtle)] ${paymentMethod === 'swish' ? 'border-black bg-[var(--color-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : ''}`}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[#ff2b44] flex items-center justify-center flex-shrink-0">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[0.875rem] font-bold text-[var(--color-text-primary)]">
                    Swish
                  </span>
                  <span className="text-[0.75rem] text-[var(--color-text-secondary)] font-normal">
                    Fastest
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center transition-all duration-200 ${paymentMethod === 'swish' ? 'bg-black border-black text-white' : 'text-transparent'}`}
                >
                  <Check size={16} />
                </div>
              </div>
            </label>

            {/* Klarna */}
            <label className={`relative cursor-pointer`}>
              <input
                type="radio"
                name="payment"
                value="klarna"
                checked={paymentMethod === 'klarna'}
                onChange={() => setPaymentMethod('klarna')}
                className="absolute opacity-0"
              />
              <div
                className={`flex items-center gap-4 py-[14px] px-4 border border-[var(--color-border)] rounded-[var(--radius-md)] transition-all duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] bg-white hover:border-[var(--color-border)] hover:bg-[var(--ui-bg-subtle)] ${paymentMethod === 'klarna' ? 'border-black bg-[var(--color-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : ''}`}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[#ffb3c7] text-black flex items-center justify-center flex-shrink-0">
                  <span className="font-black text-[1.2rem] tracking-[-1px]">
                    K.
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[0.875rem] font-bold text-[var(--color-text-primary)]">
                    Klarna
                  </span>
                  <span className="text-[0.75rem] text-[var(--color-text-secondary)] font-normal">
                    Pay later
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center transition-all duration-200 ${paymentMethod === 'klarna' ? 'bg-black border-black text-white' : 'text-transparent'}`}
                >
                  <Check size={16} />
                </div>
              </div>
            </label>

            {/* Card */}
            <label className={`relative cursor-pointer`}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
                className="absolute opacity-0"
              />
              <div
                className={`flex items-center gap-4 py-[14px] px-4 border border-[var(--color-border)] rounded-[var(--radius-md)] transition-all duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] bg-white hover:border-[var(--color-border)] hover:bg-[var(--ui-bg-subtle)] ${paymentMethod === 'card' ? 'border-black bg-[var(--color-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : ''}`}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--ui-bg-subtle)] flex items-center justify-center flex-shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[0.875rem] font-bold text-[var(--color-text-primary)]">
                    Card
                  </span>
                  <span className="text-[0.75rem] text-[var(--color-text-secondary)] font-normal">
                    Visa, MC
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center transition-all duration-200 ${paymentMethod === 'card' ? 'bg-black border-black text-white' : 'text-transparent'}`}
                >
                  <Check size={16} />
                </div>
              </div>
            </label>

            {/* Apple / Google */}
            <label className={`relative cursor-pointer`}>
              <input
                type="radio"
                name="payment"
                value="digital"
                checked={paymentMethod === 'digital'}
                onChange={() => setPaymentMethod('digital')}
                className="absolute opacity-0"
              />
              <div
                className={`flex items-center gap-4 py-[14px] px-4 border border-[var(--color-border)] rounded-[var(--radius-md)] transition-all duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] bg-white hover:border-[var(--color-border)] hover:bg-[var(--ui-bg-subtle)] ${paymentMethod === 'digital' ? 'border-black bg-[var(--color-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' : ''}`}
              >
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--ui-bg-subtle)] flex items-center justify-center flex-shrink-0">
                  <SmartphoneNfc size={20} />
                </div>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[0.875rem] font-bold text-[var(--color-text-primary)]">
                    Apple / Google
                  </span>
                  <span className="text-[0.75rem] text-[var(--color-text-secondary)] font-normal">
                    One-tap
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border border-[var(--color-border)] flex items-center justify-center transition-all duration-200 ${paymentMethod === 'digital' ? 'bg-black border-black text-white' : 'text-transparent'}`}
                >
                  <Check size={16} />
                </div>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-[var(--color-brand-primary)] text-white border-none rounded-[var(--radius-full)] font-bold text-[1.1rem] cursor-pointer transition-all duration-200 ease-[var(--ease-hover)] mt-2 disabled:bg-[var(--ui-bg-subtle)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none hover:bg-[var(--color-brand-primary-hover)] hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        >
          Pay {total} SEK
        </button>

        <div className="mt-2 border-t border-[var(--color-border)] pt-6">
          <div className="flex items-center justify-center gap-5 mb-3 max-[480px]:flex-col max-[480px]:gap-2">
            <div className="flex items-center gap-[6px] text-[0.75rem] font-semibold text-[var(--color-success)]">
              <Check size={14} className="trust-icon" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-[6px] text-[0.75rem] font-semibold text-[var(--color-text-secondary)]">
              <Zap size={14} className="text-[var(--color-text-primary)]" />
              <span>Instant download</span>
            </div>
          </div>
          <div className="text-[0.75rem] text-[var(--color-text-secondary)] leading-[1.5] text-center px-4 opacity-70">
            We'll send the download link to your verified email after payment
            (valid 24h). JPEG format.
          </div>
        </div>
      </form>
    </div>
  );
};
