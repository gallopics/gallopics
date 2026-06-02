import React, { useState } from 'react';
import { Check, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { api, type CheckoutLineItem, type CheckoutOrder } from '../data/apiClient';

declare global {
  interface Window {
    Klarna?: {
      Payments: {
        init: (config: { client_token: string }) => void;
        load: (
          options: {
            container: string;
            payment_method_category?: string;
          },
          data: Record<string, never>,
          callback: (response: { show_form?: boolean; error?: unknown }) => void
        ) => void;
        authorize: (
          options: { payment_method_category?: string },
          data: Record<string, never>,
          callback: (response: {
            approved?: boolean;
            authorization_token?: string;
            error?: unknown;
          }) => void
        ) => void;
      };
    };
  }
}

interface CheckoutPanelProps {
  total: number;
  lineItems?: CheckoutLineItem[];
  onPaymentSuccess?: (order: CheckoutOrder) => void;
  onPay?: (email: string, method: string) => void;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  total,
  lineItems,
  onPaymentSuccess,
  onPay,
}) => {
  const [email, setEmail] = useState('');
  const [klarnaStep, setKlarnaStep] = useState<
    'idle' | 'loading' | 'ready' | 'authorizing' | 'complete'
  >('idle');
  const [klarnaOrderId, setKlarnaOrderId] = useState<string | null>(null);
  const [klarnaError, setKlarnaError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  React.useEffect(() => {
    if (window.Klarna?.Payments) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://x.klarnacdn.net/kp/lib/v1/api.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setKlarnaError('Could not load Klarna checkout.');
    document.head.appendChild(script);
  }, []);

  // Check storage for the last receipt email.
  React.useEffect(() => {
    const saved =
      sessionStorage.getItem('gallopics_receipt_email') ||
      localStorage.getItem('gallopics_receipt_email');
    if (saved) {
      setEmail(saved);
    }
  }, []);

  const handleStartKlarna = async () => {
    if (!lineItems?.length) {
      onPay?.(email, 'klarna');
      return;
    }

    setKlarnaError(null);
    setKlarnaStep('loading');

    try {
      const session = await api.createCheckoutSession(lineItems, email);
      setKlarnaOrderId(session.order_id);

      if (!window.Klarna?.Payments) {
        throw new Error('Klarna is still loading. Try again in a moment.');
      }

      window.Klarna.Payments.init({ client_token: session.client_token });
      window.Klarna.Payments.load(
        {
          container: '#klarna-payments-container',
          payment_method_category: 'pay_now',
        },
        {},
        response => {
          if (response.show_form) {
            setKlarnaStep('ready');
          } else {
            setKlarnaStep('idle');
            setKlarnaError('Klarna is not available for this checkout.');
          }
        }
      );
    } catch (error) {
      setKlarnaStep('idle');
      setKlarnaError(
        error instanceof Error
          ? error.message
          : 'Could not start Klarna checkout.'
      );
    }
  };

  const handleAuthorizeKlarna = () => {
    if (!klarnaOrderId || !window.Klarna?.Payments) return;

    setKlarnaError(null);
    setKlarnaStep('authorizing');
    window.Klarna.Payments.authorize(
      { payment_method_category: 'pay_now' },
      {},
      async response => {
        if (!response.approved || !response.authorization_token) {
          setKlarnaStep('ready');
          setKlarnaError('Klarna did not approve this payment.');
          return;
        }

        try {
          const order = await api.authorizeCheckout(
            klarnaOrderId,
            response.authorization_token
          );
          setKlarnaStep('complete');
          onPaymentSuccess?.(order);
        } catch (error) {
          setKlarnaStep('ready');
          setKlarnaError(
            error instanceof Error
              ? error.message
              : 'Payment was approved by Klarna but could not be completed.'
          );
        }
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;
    sessionStorage.setItem('gallopics_receipt_email', email);
    localStorage.setItem('gallopics_receipt_email', email);
    if (klarnaStep === 'ready') {
      handleAuthorizeKlarna();
      return;
    }
    void handleStartKlarna();
  };

  const isEmailValid = /\S+@\S+\.\S+/.test(email);

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
          <label htmlFor="email">Receipt email</label>
          <input
            type="email"
            id="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={emailInputClass}
          />
          <p className="text-[0.75rem] text-[var(--color-text-secondary)] mt-2">
            We will send your Gallopics receipt and photo links to this email.
          </p>
        </div>

        <div className={!isEmailValid ? 'opacity-50 pointer-events-none' : ''}>
          <label className="block text-[0.875rem] font-semibold mb-3">
            Payment
          </label>
          <div className="flex items-center gap-4 py-[14px] px-4 border border-black rounded-[var(--radius-md)] bg-[var(--color-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
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
                Secure checkout, instant capture
              </span>
            </div>
            <ShieldCheck size={20} className="text-[var(--color-success)]" />
          </div>

          <div id="klarna-payments-container" className="mt-4" />

          {klarnaError && (
            <p className="text-[0.8125rem] text-[var(--color-danger)] mt-3 font-medium">
              {klarnaError}
            </p>
          )}

          {klarnaStep === 'complete' && (
            <p className="text-[0.8125rem] text-[var(--color-success)] mt-3 font-semibold">
              Payment captured. Your Gallopics receipt has been sent by email.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={
            !isEmailValid ||
            !scriptReady ||
            klarnaStep === 'loading' ||
            klarnaStep === 'authorizing' ||
            klarnaStep === 'complete'
          }
          className="w-full py-4 bg-[var(--color-brand-primary)] text-white border-none rounded-[var(--radius-full)] font-bold text-[1.1rem] cursor-pointer transition-all duration-200 ease-[var(--ease-hover)] mt-2 disabled:bg-[var(--ui-bg-subtle)] disabled:text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none hover:bg-[var(--color-brand-primary-hover)] hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
        >
          {klarnaStep === 'loading' || klarnaStep === 'authorizing' ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {klarnaStep === 'loading' ? 'Loading Klarna' : 'Completing payment'}
            </span>
          ) : klarnaStep === 'ready' ? (
            `Complete payment ${total} SEK`
          ) : (
            `Pay ${total} SEK with Klarna`
          )}
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
            Your Gallopics receipt is sent after payment. Download links are
            available immediately. JPEG format.
          </div>
        </div>
      </form>
    </div>
  );
};
