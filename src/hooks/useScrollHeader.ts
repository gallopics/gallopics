import { useState, useEffect } from 'react';

export const useScrollHeader = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const direction = currentScrollY > lastScrollY ? 'down' : 'up';

            // Progressive Collapse Logic
            // Header Height estimate: ~72px (Nav) + ~150px (Profile) ~ 220px total.
            // We want to hide "Top Nav" (72px) first, then "Profile" (remaining).
            // Actually, simplified approach per request:
            // "Show full header... Scroll down -> hide main header first... then collapse profile."

            // Simpler "Hide on Down, Show on Up" for the WHOLE header container:
            if (direction === 'down' && currentScrollY > 100) {
                setIsVisible(false); // Hide
            } else if (direction === 'up' || currentScrollY < 100) {
                setIsVisible(true); // Show
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return { isVisible };
};
