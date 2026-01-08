import { useNavigate, useLocation } from 'react-router-dom';
import { urlLanguageService } from '../services/urlLanguageService';

/**
 * Custom hook for navigation that preserves URL parameters (especially lang).
 * Uses DRY principle to ensure all navigations maintain URL parameters.
 * 
 * @returns A navigation function that preserves existing URL parameters
 */
export const useNavigationWithParams = () => {
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Navigate to a path while preserving existing URL parameters.
     * If the path already contains parameters, they will be merged with existing ones.
     * 
     * @param path - The path to navigate to (can include query string)
     * @param options - Optional parameters to add/override
     */
    const navigateWithParams = (
        path: string,
        options?: {
            /** Parameters to add or override */
            params?: Record<string, string | null>;
            /** If true, replace current history entry instead of adding new one */
            replace?: boolean;
        }
    ) => {
        // Get current URL parameters
        const currentParams = new URLSearchParams(location.search);
        
        // Get language from current URL or service (default to 'en-US')
        const currentLang = currentParams.get('lang') || urlLanguageService.getCurrentLanguage() || 'en-US';
        
        // Parse the target path
        const [pathname, queryString] = path.split('?');
        const targetParams = new URLSearchParams(queryString || '');
        
        // Merge parameters: preserve current params, then override with target path params, then override with options
        const mergedParams = new URLSearchParams();
        
        // First, add current parameters (preserve existing state)
        currentParams.forEach((value, key) => {
            mergedParams.set(key, value);
        });
        
        // Then, override with target path parameters (if path has explicit params, use those)
        targetParams.forEach((value, key) => {
            mergedParams.set(key, value);
        });
        
        // Finally, override with explicit options (highest precedence)
        if (options?.params) {
            Object.entries(options.params).forEach(([key, value]) => {
                if (value === null) {
                    mergedParams.delete(key);
                } else {
                    mergedParams.set(key, value);
                }
            });
        }
        
        // Ensure lang parameter is always present
        if (!mergedParams.has('lang')) {
            mergedParams.set('lang', currentLang);
        }
        
        // Build final URL
        const finalPath = mergedParams.toString() 
            ? `${pathname}?${mergedParams.toString()}`
            : pathname;
        
        // Navigate
        if (options?.replace) {
            navigate(finalPath, { replace: true });
        } else {
            navigate(finalPath);
        }
    };

    return navigateWithParams;
};

