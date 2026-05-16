import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('meta-theme');
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'dark') html.classList.add('dark');
        else html.classList.remove('dark');
        localStorage.setItem('meta-theme', theme);
    }, [theme]);

    return {
        theme,
        isDark: theme === 'dark',
        toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    };
}
