import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ModernSearchBar } from './ModernSearchBar';
import { ProfileAvatar } from './ProfileAvatar';

interface TitleHeaderProps {
    title: React.ReactNode;
    topSubtitle?: React.ReactNode;
    subtitle?: React.ReactNode;
    stats?: React.ReactNode;
    rightContent?: React.ReactNode;
    avatar?: string | React.ReactNode;
    avatarVariant?: 'rider' | 'horse' | 'photographer' | 'default';
    description?: React.ReactNode;
    compact?: boolean;
    variant?: 'default' | 'ehome' | 'workspace' | 'upload';
    optionalClose?: React.ReactNode;
    avatarShape?: 'circle' | 'square';
    avatarMobileRow?: boolean;
    className?: string;
}

interface HeroCardProps {
    extraClass?: string;
    title: React.ReactNode;
    description: React.ReactNode;
}

const HeroCard = ({ extraClass = '', title, description }: HeroCardProps) => (
    <div className={`hero-card ${extraClass}`}>
        <div className="flex flex-col gap-4 max-w-[480px] z-[2] flex-1">
            <h1 className="font-['Sora',sans-serif] text-5xl max-md:text-[2.5rem] max-[375px]:text-[2.25rem] font-semibold leading-[1.05] text-white tracking-[-0.03em] m-0">{title}</h1>
            <p className="text-base leading-relaxed text-white/90 font-[450] m-0">{description}</p>
        </div>
        <div className="mt-8 max-w-[560px] max-md:hidden">
            <ModernSearchBar theme="light" heroMode={true} isMobileTrigger={true} mobilePlaceholder="Search" />
        </div>
    </div>
);

const GuestHeroCarousel: React.FC<{ title: React.ReactNode; description: React.ReactNode }> = ({ title, description }) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [activeSlide, setActiveSlide] = useState(0);

    const handleScroll = useCallback(() => {
        const el = carouselRef.current;
        if (!el) return;
        const index = Math.round(el.scrollLeft / el.offsetWidth);
        setActiveSlide(Math.min(2, Math.max(0, index)));
    }, []);

    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const scrollToSlide = (i: number) => {
        const el = carouselRef.current;
        if (!el) return;
        el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
    };

    return (
        <div>
            <div className="hero-carousel-container">
                <div
                    ref={carouselRef}
                    className="hero-grid grid [grid-template-columns:minmax(420px,8fr)_minmax(240px,2fr)_minmax(240px,2fr)] gap-6 w-full items-stretch max-lg:[grid-template-columns:1fr_1fr]"
                >
                <HeroCard extraClass="hero-card--guest" title={title} description={description} />

                {/* Photographer card */}
                <div className="hero-card-secondary--pg">
                    <div className="flex flex-col gap-4 max-w-[480px] z-[2] flex-1">
                        <h2 className="font-['Sora',sans-serif] text-2xl max-md:text-[2.5rem] font-semibold tracking-[-0.02em] text-white leading-[1.1] m-0 [text-wrap:balance]">I am a{' '}<br />Photographer</h2>
                        <p className="text-[0.8125rem] leading-[1.5] text-white/90 m-0">Gallopics is a platform for competition photographers. Book events, upload galleries, manage orders and track your sales – all in one place.</p>
                    </div>
                    <div className="mt-8 max-md:mt-auto">
                        <a
                            href="/register"
                            className="bg-[var(--color-brand-primary)] text-white h-11 px-6 rounded-[99px] font-bold text-[0.875rem] inline-flex items-center justify-center no-underline transition-colors duration-200 hover:bg-[var(--color-brand-primary-hover)]"
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'register', type: 'photographer' } }));
                            }}
                        >
                            Register
                        </a>
                    </div>
                </div>

                {/* Organizer card */}
                <div className="hero-card-secondary">
                    <div className="flex flex-col gap-4 max-w-[480px] z-[2] flex-1">
                        <h2 className="font-['Sora',sans-serif] text-2xl max-md:text-[2.5rem] font-semibold tracking-[-0.02em] text-white leading-[1.1] m-0 [text-wrap:balance]">Organizing a{' '}<br />competition?</h2>
                        <p className="text-[0.8125rem] leading-[1.5] text-white/90 m-0">Helps you find the right photographers, coordinate coverage, and make it easy for riders to discover and purchase their photos.</p>
                    </div>
                    <div className="mt-8 max-md:mt-auto">
                        <a
                            href="/contact"
                            className="bg-[var(--color-text-primary)] text-white h-11 px-6 rounded-[99px] font-bold text-[0.875rem] inline-flex items-center justify-center no-underline transition-all duration-200 hover:bg-[var(--color-accent)]"
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new Event('open-contact-support'));
                            }}
                        >
                            Contact us
                        </a>
                    </div>
                </div>
            </div>
            </div> {/* hero-carousel-container */}

            {/* Pagination dots — mobile only, shown via guestHome.mobile.css */}
            <div className="hero-pagination hidden">
                {[0, 1, 2].map(i => (
                    <button
                        key={i}
                        className={`hero-dot${activeSlide === i ? ' active' : ''}`}
                        onClick={() => scrollToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export const TitleHeader: React.FC<TitleHeaderProps> = ({
    title,
    topSubtitle,
    subtitle,
    stats,
    rightContent,
    avatar,
    avatarVariant,
    description,
    compact = false,
    variant = 'default',
    optionalClose,
    avatarShape = 'circle',
    avatarMobileRow = false,
    className = ''
}) => {
    const { user, isAuthenticated } = useAuth();

    // Ehome Hero Variant
    if (variant === 'ehome') {
        const isAdmin = user?.role === 'admin';
        const fullName = user?.displayName ?? 'Photographer';
        const consoleIcon = isAdmin ? <LayoutDashboard size={18} /> : <Camera size={18} />;
        const consoleDescription = isAdmin
            ? 'Approve photographers, manage events, monitor platform activity, and keep everything running smoothly.'
            : 'Manage your events, upload galleries, track your sales, and grow your photography business — all in one place.';

        return (
            <section className="py-10 pb-6 bg-transparent max-md:pt-4">
                <div className="container">
                    {isAuthenticated ? (
                        <div className="grid grid-cols-[1fr_280px] gap-6 items-stretch max-lg:grid-cols-[1fr_240px] max-md:grid-cols-1">
                            <HeroCard title={title} description={description} />

                            {/* My Console card */}
                            <div className="hero-card-secondary max-md:hidden">
                                <div className="flex flex-col gap-4">
                                    <h2 className="font-['Sora',sans-serif] text-2xl font-semibold tracking-[-0.02em] text-white leading-[1.1] m-0">
                                        Hello,<br />{fullName} 👋
                                    </h2>
                                    <p className="text-[0.875rem] leading-[1.6] text-white/80 m-0">{consoleDescription}</p>
                                </div>
                                <a href="/pg" className="mt-8 self-start inline-flex items-center gap-2 bg-black text-white h-12 px-6 rounded-[99px] font-bold text-[0.875rem] no-underline transition-all duration-200 hover:bg-[var(--color-text-primary)]">
                                    {consoleIcon}
                                    {isAdmin ? 'My Console' : 'My Studio'}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <GuestHeroCarousel title={title} description={description} />
                    )}
                </div>
            </section>
        );
    }

    // Default Layout (Profile/Event Headers)
    const alignClass = (variant === 'upload' || variant === 'workspace') ? 'items-center' : 'items-end';
    const avatarSize = avatarShape === 'square' ? 100 : 80;
    const avatarWrapperClass = avatarShape === 'square'
        ? `title-avatar-wrapper flex-shrink-0 flex items-center justify-center overflow-hidden is-square w-[100px] h-[100px] rounded-2xl bg-white border border-[var(--color-border)] p-2 ${avatarMobileRow ? 'max-md:w-14 max-md:h-14 max-md:p-1' : 'max-md:w-20 max-md:h-20 max-md:p-1.5'}`
        : 'title-avatar-wrapper flex-shrink-0 flex items-center justify-center';

    return (
        <section className={`title-header variant-${variant} ${compact ? 'compact' : ''} ${className}`}>
            <div className="container">
                <div className={`flex justify-between gap-8 ${alignClass} max-md:flex-col max-md:items-start max-md:gap-6`}>
                    <div className="flex flex-col gap-3">
                        <div className={`title-header-inner-flex flex items-center gap-6 ${avatarMobileRow ? 'max-md:flex-row max-md:items-start max-md:gap-5' : 'max-md:flex-col max-md:items-start max-md:gap-4'}`}>
                            {(avatar || avatarVariant) && (
                                <div className={avatarWrapperClass}>
                                    {typeof avatar === 'string' || avatarVariant ? (
                                        <ProfileAvatar
                                            variant={avatarVariant}
                                            url={typeof avatar === 'string' ? avatar : undefined}
                                            name={typeof title === 'string' ? title : ''}
                                            size={avatarSize}
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--ui-bg-subtle)] flex items-center justify-center">
                                            {avatar}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="title-text-group max-md:w-full">
                                {topSubtitle && <div className="title-header-top-subtitle">{topSubtitle}</div>}
                                <h1 className="title-header-title">{title}</h1>
                                {subtitle && <div className="title-header-subtitle">{subtitle}</div>}
                                {stats && <div className="flex items-baseline gap-x-3 gap-y-1 text-[0.875rem] text-[var(--color-text-secondary)] flex-wrap leading-[1.15] mt-4">{stats}</div>}
                                {description && <div className="max-w-[600px] text-[1rem] leading-[1.4] text-[var(--color-text-secondary)] mt-4">{description}</div>}
                            </div>
                        </div>
                    </div>
                    {rightContent && <div className="flex items-center">{rightContent}</div>}
                    {optionalClose && <div className="ml-[var(--spacing-md)] flex items-center">{optionalClose}</div>}
                </div>
            </div>
        </section>
    );
};
