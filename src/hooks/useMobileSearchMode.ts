import { useState, useEffect, useCallback, type RefObject } from 'react';

/**
 * useMobileSearchMode - Enforces Google-like mobile search focus behavior
 * 
 * @param containerRef - Ref to the search container element
 * @returns { isSearchMode, activateSearch, deactivateSearch }
 */
export function useMobileSearchMode(containerRef: RefObject<HTMLElement>) {
    const [isSearchMode, setIsSearchMode] = useState(false);

    // Helper: Check if mobile
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    const activateSearch = useCallback(() => {
        if (!isMobile()) return;
        setIsSearchMode(true);
        document.body.classList.add('isSearchMode');

        // Scroll to top with slight delay for keyboard trigger
        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        }, 300);

    }, [containerRef]);

    const deactivateSearch = useCallback(() => {
        setIsSearchMode(false);
        document.body.classList.remove('isSearchMode');
        // Restore focus to body or blur? optional
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.classList.remove('isSearchMode');
        };
    }, []);

    return {
        isSearchMode,
        activateSearch,
        deactivateSearch
    };
}
