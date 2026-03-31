import React from 'react';
import { Instagram } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import { FacebookIcon } from './FacebookIcon';

export interface CopyrightBarProps {
  minimal?: boolean; // If true, white bg, no social icons (standalone, no full footer above)
  sidebar?: boolean; // If true, remove fluid container for sidebar use
  isAdmin?: boolean; // If true, hide Support link (admin context)
  noLinks?: boolean; // If true, hide all nav links (info pages)
}

export const CopyrightBar: React.FC<CopyrightBarProps> = ({
  minimal = false,
  sidebar = false,
  isAdmin = false,
  noLinks = false,
}) => {
  // Sidebar variant: compact, transparent, stacked — matches pg-sidebar-footer override
  if (sidebar) {
    return (
      <div className="flex flex-col items-start gap-2 w-full">
        <div className="flex items-center gap-x-3 flex-wrap gap-y-1">
          <a
            href="/faq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-brand-primary)]"
          >
            FAQs
          </a>
          {!isAdmin && (
            <a
              href="#"
              className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-brand-primary)]"
              onClick={e => {
                e.preventDefault();
                window.dispatchEvent(
                  new CustomEvent('open-contact-support', {
                    detail: { photographerOnly: true },
                  }),
                );
              }}
            >
              Support
            </a>
          )}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-brand-primary)]"
          >
            Terms
          </a>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.75rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-brand-primary)]"
          >
            Privacy
          </a>
        </div>
        <span className="text-[0.75rem] text-[var(--color-text-secondary)]">
          © {new Date().getFullYear()} Gallopics
        </span>
      </div>
    );
  }

  // Minimal = transparent bar with no social icons (used standalone, e.g. Cart, pg pages)
  if (minimal) {
    return (
      <div className="mt-auto border-t border-[var(--color-border)] py-4">
        <div className="container">
          <div className="copyright-bar-inner flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2">
            <span className="text-[0.8125rem] text-[var(--color-text-secondary)]">
              © {new Date().getFullYear()} Gallopics
            </span>
            {!noLinks && (
              <div className="flex items-center gap-4">
                <a
                  href="/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text-primary)]"
                >
                  FAQs
                </a>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text-primary)]"
                >
                  Terms of service
                </a>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text-primary)]"
                >
                  Privacy policy
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full dark bar (used after the dark full footer)
  const content = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full max-md:flex max-md:flex-col max-md:items-center max-md:gap-6 max-md:text-center">
      <div className="flex justify-start max-md:order-1 max-md:justify-center">
        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/gallopics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex items-center justify-center w-9 h-9 max-md:w-11 max-md:h-11 rounded-full bg-white/10 text-white transition-all duration-200 ease-in-out no-underline hover:bg-white/20 hover:scale-110"
          >
            <Instagram size={20} />
          </a>
          <a
            href="https://www.tiktok.com/@gallopics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="flex items-center justify-center w-9 h-9 max-md:w-11 max-md:h-11 rounded-full bg-white/10 text-white transition-all duration-200 ease-in-out no-underline hover:bg-white/20 hover:scale-110"
          >
            <TikTokIcon size={20} />
          </a>
          <a
            href="https://www.facebook.com/gallopics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex items-center justify-center w-9 h-9 max-md:w-11 max-md:h-11 rounded-full bg-white/10 text-white transition-all duration-200 ease-in-out no-underline hover:bg-white/20 hover:scale-110"
          >
            <FacebookIcon size={20} />
          </a>
        </div>
      </div>

      <div className="text-center flex justify-center items-center whitespace-nowrap max-md:order-3 max-md:w-full max-md:justify-center max-md:whitespace-normal">
        <span className="text-[0.8125rem] text-[var(--color-text-secondary)]">
          © {new Date().getFullYear()} Gallopics
        </span>
      </div>

      <div className="flex justify-end items-center gap-4 max-md:order-2 max-md:w-full max-md:justify-center max-md:flex-wrap max-md:gap-y-2 max-md:gap-x-4">
        <a
          href="/faq"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8125rem] text-[var(--color-text-secondary)] no-underline hover:text-white transition-colors duration-150 hidden max-md:inline"
        >
          FAQs
        </a>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8125rem] text-[var(--color-text-secondary)] no-underline hover:text-white transition-colors duration-150"
        >
          Terms of service
        </a>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8125rem] text-[var(--color-text-secondary)] no-underline hover:text-white transition-colors duration-150"
        >
          Privacy policy
        </a>
      </div>
    </div>
  );

  return (
    <div className="bg-[var(--footer-bg)] border-t border-white/[0.05] py-7 lg:py-3.5">
      <div className="container">{content}</div>
    </div>
  );
};
