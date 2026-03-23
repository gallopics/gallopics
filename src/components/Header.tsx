import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Camera, LayoutDashboard } from 'lucide-react';
import { ModernSearchBar } from './ModernSearchBar';
import { useCart } from '../context/CartContext';
import { AuthModal } from './AuthModal';
import { EditProfileModal } from './EditProfileModal';
import { DesktopRecommendationModal } from './DesktopRecommendationModal';
import { useAuth } from '../context/AuthContext';
import { ContactSupportModal } from './ContactSupportModal';
import { createPortal } from 'react-dom';
import { PgToast } from '../pages/pg/PgToast';

export const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isDesktopRecommendationModalOpen, setIsDesktopRecommendationModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isContactPhotographerOnly, setIsContactPhotographerOnly] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'info' | 'danger'; message: string } | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
    const guestMenuRef = useRef<HTMLDivElement>(null);
    const [authModalConfig, setAuthModalConfig] = useState<{ tab: 'signin' | 'register'; type: 'photographer' | 'buyer' }>({ tab: 'signin', type: 'photographer' });
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { cart } = useCart();
    const { isAuthenticated, user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);

    const currentPath = encodeURIComponent(location.pathname + location.search);
    const isOnboarding = location.pathname.startsWith('/pg/onboarding');
    const isMobile = windowWidth < 768;

    // Window Resize Effect
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial Scroll Effect
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const isScrolled = window.scrollY > 20;
                    setScrolled(prev => {
                        if (prev !== isScrolled) return isScrolled;
                        return prev;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleOpenAuth = (e: any) => {
            const { tab, type } = e.detail || { tab: 'signin', type: 'photographer' };
            setAuthModalConfig({ tab, type });
            setIsContactModalOpen(false); // Close other modals if open
            setIsAuthModalOpen(true);
        };
        const handleOpenMobileRecommendation = () => {
            setIsAuthModalOpen(false);
            setIsContactModalOpen(false);
            setIsDesktopRecommendationModalOpen(true);
        };
        const handleOpenContact = (e: any) => {
            setIsAuthModalOpen(false);
            setIsEditProfileModalOpen(false);
            setIsContactPhotographerOnly(!!e?.detail?.photographerOnly);
            setIsContactModalOpen(true);
        };
        const handleShowToast = (e: any) => {
            const { type, message } = e.detail;
            setToast({ type, message });
            setTimeout(() => setToast(null), 4000);
        };

        window.addEventListener('open-auth-modal', handleOpenAuth);
        window.addEventListener('open-mobile-recommendation', handleOpenMobileRecommendation);
        window.addEventListener('open-contact-support', handleOpenContact);
        window.addEventListener('show-toast', handleShowToast);

        return () => {
            window.removeEventListener('open-auth-modal', handleOpenAuth);
            window.removeEventListener('open-mobile-recommendation', handleOpenMobileRecommendation);
            window.removeEventListener('open-contact-support', handleOpenContact);
            window.removeEventListener('show-toast', handleShowToast);
        };
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (guestMenuRef.current && !guestMenuRef.current.contains(event.target as Node)) {
                setIsGuestMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper: Generate stable random color based on name
    const getAvatarColor = (name: string) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <>
            <header className={[
                'bg-white border border-black/[0.04] sticky top-0 z-[1000] overflow-visible transition-[background-color,box-shadow] duration-[400ms] ease-[cubic-bezier(0.2,0,0.2,1)]',
                scrolled ? 'bg-white/85 backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] border-b border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]' : ''
            ].join(' ')}>
                <div className="flex items-center justify-between gap-3 md:gap-6 min-h-16 md:h-[72px] container-fluid">
                    {/* 1. Logo (Left) */}
                    <a href="/" className="flex items-center flex-shrink-0">
                        <img src="/images/logo1-blue.svg" alt="GALLOPICS" className="h-6 min-[480px]:h-7 w-auto block" />
                    </a>

                    {/* 3. Utility Icons (Right) */}
                    {!isOnboarding ? (
                        <div className="flex items-center gap-1.5 min-[480px]:gap-3 md:gap-3 ml-auto relative flex-wrap justify-end">
                            <ModernSearchBar collapsible />

                            {isAuthenticated ? (
                                <>
                                    <button
                                        className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text-primary)] transition-[background-color,scale,box-shadow,border-color] duration-200 ease-in-out bg-white border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative"
                                        aria-label="Cart"
                                        onClick={() => navigate(`/cart?from=${currentPath}`)}
                                    >
                                        <ShoppingBag size={22} />
                                        {cart.length > 0 && (
                                            <span className="absolute top-1.5 right-1.5 bg-[var(--brand)] text-white text-[0.625rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white">
                                                {cart.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Signed In: Workspace Button (Hidden on Mobile) */}
                                    {!isMobile && (
                                        <>
                                            <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
                                            <button
                                                className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text-primary)] transition-[background-color,scale,box-shadow,border-color] duration-200 ease-in-out bg-white border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                                                aria-label="Workspace"
                                                onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/pg')}
                                                title={user?.role === 'admin' ? 'Go to My Console' : 'Go to My Studio'}
                                            >
                                                {user?.role === 'admin' ? <LayoutDashboard size={20} /> : <Camera size={20} />}
                                            </button>
                                        </>
                                    )}

                                    {/* User Chip with Dropdown */}
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            className="flex items-center gap-3 px-4 py-1.5 pl-1.5 rounded-[32px] border border-[var(--color-border)] bg-white cursor-pointer transition-all duration-200 ease-in-out ml-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-[1.02] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] max-md:p-1 max-md:border-0"
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-full text-white font-semibold text-[0.875rem] flex items-center justify-center uppercase flex-shrink-0"
                                                style={{ backgroundColor: user?.avatarUrl ? 'transparent' : getAvatarColor(user?.displayName || 'U') }}
                                            >
                                                {user?.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    (user?.displayName || 'U').charAt(0)
                                                )}
                                            </div>
                                            <div className="flex flex-col text-left leading-[1.2] max-md:hidden">
                                                <span className="text-[0.875rem] font-semibold text-[var(--color-text-primary)]">{user?.displayName || 'Klara Fors'}</span>
                                                <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-[0.5px] font-medium">{user?.role === 'admin' ? 'Admin' : (user?.city || 'Stockholm')}</span>
                                            </div>
                                        </button>

                                        {isUserMenuOpen && (
                                            <div className="dropdown-menu absolute top-[120%] right-0 w-44 z-[1010] animate-[fadeInDropdown_0.15s_ease-out]">
                                                <button className="dropdown-item" onClick={() => { setIsEditProfileModalOpen(true); setIsUserMenuOpen(false); }}>Edit contact</button>
                                                <button className="dropdown-item" onClick={() => { navigate(user?.role === 'admin' ? '/admin/events' : `/photographer/${user?.id || 'klara-fors'}`); setIsUserMenuOpen(false); }}>{user?.role === 'admin' ? 'Admin dashboard' : 'My public profile'}</button>
                                                <div className="dropdown-divider" />
                                                <button className="dropdown-item dropdown-item-danger" onClick={() => { logout(); setIsUserMenuOpen(false); navigate('/'); }}>Log out</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Guest: Cart & Auth Icon */}
                                    <button
                                        className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text-primary)] transition-[background-color,scale,box-shadow,border-color] duration-200 ease-in-out bg-white border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative"
                                        aria-label="Cart"
                                        onClick={() => navigate(`/cart?from=${currentPath}`)}
                                    >
                                        <ShoppingBag size={22} />
                                        {cart.length > 0 && (
                                            <span className="absolute top-1.5 right-1.5 bg-[var(--brand)] text-white text-[0.625rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white">
                                                {cart.length}
                                            </span>
                                        )}
                                    </button>

                                    <div className="w-px h-6 bg-[var(--color-border)] mx-1 max-md:hidden" />

                                    <div className="relative" ref={guestMenuRef}>
                                        <button
                                            className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--color-text-primary)] transition-[background-color,scale,box-shadow,border-color] duration-200 ease-in-out bg-white border border-[var(--color-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                                            aria-label="Sign in or Register"
                                            onClick={() => {
                                                if (isMobile) {
                                                    setIsDesktopRecommendationModalOpen(true);
                                                } else {
                                                    setIsGuestMenuOpen(v => !v);
                                                }
                                            }}
                                        >
                                            <User size={22} />
                                        </button>

                                        {isGuestMenuOpen && (
                                            <div className="dropdown-menu absolute top-[120%] right-0 w-36 z-[1010] animate-[fadeInDropdown_0.15s_ease-out]">
                                                <button className="dropdown-item" onClick={() => { setAuthModalConfig({ tab: 'signin', type: 'photographer' }); setIsAuthModalOpen(true); setIsGuestMenuOpen(false); }}>Sign in</button>
                                                <button className="dropdown-item" onClick={() => { setAuthModalConfig({ tab: 'register', type: 'photographer' }); setIsAuthModalOpen(true); setIsGuestMenuOpen(false); }}>Register</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 ml-auto" />
                    )}
                </div>
            </header>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialTab={authModalConfig.tab}
                initialAccountType={authModalConfig.type}
                onSwitchTab={() => setAuthModalConfig(prev => ({
                    ...prev,
                    tab: prev.tab === 'signin' ? 'register' : 'signin'
                }))}
            />

            <EditProfileModal
                isOpen={isEditProfileModalOpen}
                onClose={() => setIsEditProfileModalOpen(false)}
            />

            <DesktopRecommendationModal
                isOpen={isDesktopRecommendationModalOpen}
                onClose={() => setIsDesktopRecommendationModalOpen(false)}
            />

            <ContactSupportModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                photographerOnly={isContactPhotographerOnly}
            />

            {toast && createPortal(
                <div className="fixed bottom-8 left-0 w-full pointer-events-none flex justify-center z-[10000]">
                    <PgToast
                        type={toast.type}
                        message={toast.message}
                        style={{ pointerEvents: 'auto' }}
                    />
                </div>,
                document.body
            )}
        </>
    );
};
