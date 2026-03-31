import React, { useState, useEffect } from 'react';
import { X, Send, Mail, MessageSquare, Loader2, Tag } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographerOnly?: boolean;
}

type UserRole = 'Photo buyer' | 'Photographer' | 'Event organiser';

const contactFormEndpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT;

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  photographerOnly = false,
}) => {
  const [role, setRole] = useState<UserRole>(
    photographerOnly ? 'Photographer' : 'Photo buyer',
  );
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+46');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [errors, setErrors] = useState<{
    email?: string;
    subject?: string;
    message?: string;
  }>({});

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setRole(photographerOnly ? 'Photographer' : 'Photo buyer');
      setEmail('');
      setCountryCode('+46');
      setPhone('');
      setSubject('');
      setMessage('');
      setStatus('idle');
      setErrors({});
    }
  }, [isOpen]);

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

  const validate = () => {
    const newErrors: { email?: string; subject?: string; message?: string } =
      {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!subject) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    if (!message) {
      newErrors.message = 'Message is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');

    const composedPhone = phone
      ? `${countryCode}${phone.replace(/\s+/g, '')}`
      : '';

    try {
      if (!contactFormEndpoint) {
        throw new Error('Missing VITE_CONTACT_FORM_ENDPOINT');
      }

      const payload = {
        role,
        email,
        phone: composedPhone,
        subject,
        message,
        source: 'gallopics-contact-form',
      };

      const response = await fetch(contactFormEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Contact request failed with status ${response.status}`,
        );
      }

      setStatus('success');

      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            type: 'success',
            message: 'Message sent successfully! We will get back to you soon.',
          },
        }),
      );

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Contact form submission failed', error);
      setStatus('error');
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            type: 'danger',
            message: 'Failed to send message. Please try again.',
          },
        }),
      );
    }
  };

  if (!isOpen) return null;

  const roles: UserRole[] = ['Photo buyer', 'Photographer', 'Event organiser'];

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container contact-support-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-[var(--modal-padding)] py-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white z-10 flex-shrink-0">
          <h2 className="text-[1.125rem] font-semibold text-[var(--color-text-primary)] m-0">
            Contact support
          </h2>
          <button
            className="w-8 h-8 rounded-full border-none bg-transparent flex items-center justify-center text-[var(--color-text-secondary)] cursor-pointer transition-all duration-200 hover:bg-black/[0.04] hover:text-[var(--color-text-primary)]"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-[var(--modal-padding)] overflow-y-auto flex-1">
          <form
            id="contact-support-form"
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {/* Segmented Control for Role — hidden in photographer-only context */}
            {!photographerOnly && (
              <div className="auth-input-group">
                <label className="auth-label">I'm contacting you as</label>
                <div className="flex bg-[var(--ui-bg-subtle)] p-[3px] rounded-[10px] mt-1">
                  {roles.map(r => (
                    <button
                      key={r}
                      type="button"
                      className={[
                        'flex-1 py-2 px-1 border-none text-[0.8125rem] font-semibold rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap max-md:text-[0.75rem] max-md:px-0.5',
                        role === r
                          ? 'bg-white text-[var(--color-brand-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                          : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                      ].join(' ')}
                      onClick={() => setRole(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="support-email">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-[14px] text-[var(--color-border)] pointer-events-none transition-colors duration-200"
                />
                <input
                  id="support-email"
                  type="email"
                  className={`auth-input !pl-[42px] ${errors.email ? 'error' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors({ ...errors, email: undefined });
                  }}
                  disabled={status === 'sending'}
                />
              </div>
              {errors.email && (
                <span className="auth-error-msg">{errors.email}</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="auth-label" htmlFor="support-phone">
                Phone number (optional)
              </label>
              <div className="flex gap-0 w-full border border-[var(--color-border)] rounded-[var(--radius-sm,6px)] bg-[var(--color-bg)] overflow-hidden transition-all duration-200 focus-within:border-[var(--color-brand-primary)] focus-within:shadow-[0_0_0_3px_var(--color-brand-tint,rgba(27,58,236,0.08))] focus-within:bg-white">
                <select
                  className="w-[90px] h-11 px-4 pr-3 border-none border-r border-[var(--color-border)] bg-transparent text-[var(--fs-sm,0.875rem)] font-medium text-[var(--color-text-primary)] cursor-pointer appearance-none bg-no-repeat focus:outline-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                    backgroundPosition: 'right 10px center',
                  }}
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  disabled={status === 'sending'}
                >
                  <option value="+46">+46</option>
                  <option value="+47">+47</option>
                  <option value="+45">+45</option>
                  <option value="+358">+358</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+49">+49</option>
                </select>
                <input
                  id="support-phone"
                  type="tel"
                  className="flex-1 h-11 px-4 border-none bg-transparent text-[var(--fs-base,1rem)] text-[var(--color-text-primary)] focus:outline-none"
                  placeholder="07X XXX XX XX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={status === 'sending'}
                />
              </div>
            </div>

            {/* Subject */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="support-subject">
                Subject
              </label>
              <div className="relative flex items-center">
                <Tag
                  size={16}
                  className="absolute left-[14px] text-[var(--color-border)] pointer-events-none transition-colors duration-200"
                />
                <input
                  id="support-subject"
                  type="text"
                  className={`auth-input !pl-[42px] ${errors.subject ? 'error' : ''}`}
                  placeholder="Subject"
                  value={subject}
                  onChange={e => {
                    setSubject(e.target.value);
                    if (errors.subject)
                      setErrors({ ...errors, subject: undefined });
                  }}
                  disabled={status === 'sending'}
                />
              </div>
              {errors.subject && (
                <span className="auth-error-msg">{errors.subject}</span>
              )}
            </div>

            {/* Message */}
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="support-message">
                How can we help?
              </label>
              <div className="relative flex items-start">
                <MessageSquare
                  size={16}
                  className="absolute left-[14px] top-[14px] text-[var(--color-border)] pointer-events-none transition-colors duration-200"
                />
                <textarea
                  id="support-message"
                  className={`auth-input !pl-[42px] !h-[120px] !py-3 resize-none leading-relaxed ${errors.message ? 'error' : ''}`}
                  placeholder="Describe your issue..."
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value);
                    if (errors.message)
                      setErrors({ ...errors, message: undefined });
                  }}
                  disabled={status === 'sending'}
                />
              </div>
              {errors.message && (
                <span className="auth-error-msg">{errors.message}</span>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-[var(--modal-padding)] pt-4 pb-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0 flex flex-col gap-4">
          <div className="w-full flex gap-3">
            <button
              type="button"
              className="modal-btn-cancel flex-1"
              onClick={onClose}
              disabled={status === 'sending'}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="contact-support-form"
              className="auth-btn-primary flex-[2] mt-0 gap-2 w-auto px-6 h-11"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send message</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-[var(--color-border)]">
            <a
              href="#"
              className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline transition-colors duration-200 hover:text-[var(--color-brand-primary)]"
            >
              FAQs
            </a>
            <span className="text-[0.625rem] text-[var(--color-border)]">
              •
            </span>
            <a
              href="#"
              className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline transition-colors duration-200 hover:text-[var(--color-brand-primary)]"
            >
              Terms
            </a>
            <span className="text-[0.625rem] text-[var(--color-border)]">
              •
            </span>
            <a
              href="#"
              className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline transition-colors duration-200 hover:text-[var(--color-brand-primary)]"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
