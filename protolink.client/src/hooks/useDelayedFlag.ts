import { useEffect, useState } from 'react';

/** True only once `active` has stayed true for `delayMs`, so fast loads never flash a loading state. */
export const useDelayedFlag = (active: boolean, delayMs: number): boolean => {
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (!active) {
            setShown(false);
            return;
        }
        const timer = window.setTimeout(() => setShown(true), delayMs);
        return () => window.clearTimeout(timer);
    }, [active, delayMs]);

    return shown;
};
