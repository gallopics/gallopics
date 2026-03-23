import React from 'react';
import { CopyrightBar } from './CopyrightBar';
import { assetUrl } from '../lib/utils';

interface FooterProps {
    minimal?: boolean;
    sidebar?: boolean;
    isAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ minimal = false, sidebar = false, isAdmin = false }) => {
    if (minimal) {
        return <CopyrightBar minimal={true} sidebar={sidebar} isAdmin={isAdmin} />;
    }

    return (
        <>
            <footer className="mt-auto bg-[var(--footer-bg)] text-white py-7 md:py-7 lg:py-7" data-footer="guest-full">
                <div className="container">
                    <div className="flex justify-between items-start gap-10 flex-nowrap max-md:flex-col max-md:items-center max-md:text-center max-md:gap-8 max-md:flex-wrap md:items-center">
                        {/* Left Column: Brand */}
                        <div className="flex flex-col gap-4 flex-1 max-w-[440px] max-md:items-center max-md:max-w-full">
                            <img src={assetUrl('images/logo2.svg')} alt="Gallopics" className="h-8 w-auto object-contain [filter:brightness(0)_invert(1)] opacity-90 self-start m-0 max-md:self-center" />
                            <p className="text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)] m-0">
                                We capture horse competitions across Sweden. Search your event, spot your photos, and purchase your favorites.
                            </p>
                        </div>

                        {/* Right Column: Compact Actions (Desktop: Row, Mobile: Stacked) */}
                        <div className="flex items-center gap-6 flex-none max-md:flex-col max-md:gap-6 max-md:w-full md:flex-row">
                            <div className="flex items-center gap-3 max-md:justify-center max-md:w-full md:pt-0">
                                <a href="#" className="text-[var(--color-text-secondary)] no-underline text-[0.875rem] font-medium transition-[color] duration-150 ease-in-out hover:text-white max-md:hidden" onClick={(e) => e.preventDefault()}>FAQs</a>
                                <span className="text-[0.4rem] text-[var(--color-text-primary)] max-md:hidden">•</span>
                                <a href="#" className="text-[var(--color-text-secondary)] no-underline text-[0.875rem] font-medium transition-[color] duration-150 ease-in-out hover:text-white max-md:hidden" onClick={(e) => e.preventDefault()}>Photographers login</a>
                            </div>
                            <div className="flex items-center">
                                <a
                                    href="#"
                                    className="bg-white text-black px-5 py-2 rounded-[99px] text-[0.875rem] font-semibold no-underline transition-all duration-200 ease-in-out inline-block hover:bg-[var(--color-border)] hover:-translate-y-0.5 max-md:px-4 max-md:py-1.5 max-md:text-[0.8125rem] whitespace-nowrap"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.dispatchEvent(new Event('open-contact-support'));
                                    }}
                                >
                                    Contact support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            <CopyrightBar minimal={false} />
        </>
    );
};
