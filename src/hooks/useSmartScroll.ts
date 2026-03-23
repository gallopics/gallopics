import { useState, useEffect, useRef } from 'react';

export const useSmartScroll = (headerHeight: number) => {
    const [offset, setOffset] = useState(0);
    const lastScrollY = useRef(0);

    useEffect(() => {
        // Simpler implementation without RAF batteling for state sync, 
        // relying on React batching or simple heavy-handed logic for correctness first by user request "smooth transitions".
        // The logic below is the robust "delta" approach.

        const updateOffset = () => {
            const currentScrollY = window.scrollY;
            const deltaY = currentScrollY - lastScrollY.current;
            lastScrollY.current = currentScrollY;

            setOffset(prev => {
                // Boundary check: if at top, always 0
                if (currentScrollY <= 0) return 0;

                // Move frame
                // Scroll Down (delta > 0): offset decreases (slides up)
                // Scroll Up (delta < 0): offset increases (slides down)
                const newOffset = prev - deltaY;

                // Clamp
                // We want to hide the "Header" part (e.g. 200px), allowing "Filters" to stick.
                // So min is -headerHeight.
                const min = -headerHeight;
                const max = 0;

                return Math.min(Math.max(newOffset, min), max);
            });
        };

        window.addEventListener('scroll', updateOffset, { passive: true });
        return () => window.removeEventListener('scroll', updateOffset);
    }, [headerHeight]);

    // Derived sticky state (with small epsilon for float precision)
    const isSticky = offset <= (-headerHeight + 2);

    return {
        offset,
        isSticky,
        style: {
            transform: `translateY(${offset}px)`,
            '--header-offset': `${offset}px`
        } as React.CSSProperties
    };
};
