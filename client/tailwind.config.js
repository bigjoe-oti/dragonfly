/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#804199',
                secondary: '#20aacf',
                accent: '#04ac8c',
                darkBg: '#0a0a0b',
                darkSurface: '#1a1a1d',
                glassBg: 'rgba(255, 255, 255, 0.05)',
                glassBorder: 'rgba(255, 255, 255, 0.1)',
                textPrimary: '#ffffff',
                textSecondary: 'rgba(255, 255, 255, 0.7)',
                textMuted: 'rgba(255, 255, 255, 0.5)',
            },
            fontFamily: {
                syne: ['Syne', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-glass': 'linear-gradient(135deg, rgba(128, 65, 153, 0.05) 0%, transparent 50%, rgba(32, 170, 207, 0.05) 100%)',
            },
            boxShadow: {
                glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                'glass-hover': '0 12px 32px 0 rgba(31, 38, 135, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            },
        },
    },
    plugins: [],
};