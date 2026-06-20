type ExtensionTheme = 'light' | 'dark';

export const getSystemTheme = (): ExtensionTheme => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
