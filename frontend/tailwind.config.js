/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-black': '#050508',
                'cyber-dark': '#0a0a12',
                'cyber-slate': '#0f1117',
                'cyber-gray': '#1a1d2e',
                'cyber-border': '#1e2235',
                'cyber-red': '#ef233c',
                'cyber-red-dark': '#c1121f',
                'cyber-red-glow': '#ef233c40',
                'cyber-blue': '#3b82f6',
                'cyber-blue-light': '#60a5fa',
                'cyber-blue-glow': '#3b82f640',
                'cyber-teal': '#0d9488',
                'cyber-amber': '#f59e0b',
                'cyber-green': '#10b981',
                'cyber-purple': '#7c3aed',
            },
            fontFamily: {
                'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
                'sans': ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-red': 'pulse-red 2s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scan': 'scan 4s linear infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                'pulse-red': {
                    '0%, 100%': { boxShadow: '0 0 5px #ef233c40, 0 0 10px #ef233c20' },
                    '50%': { boxShadow: '0 0 20px #ef233c80, 0 0 40px #ef233c40' },
                },
                'scan': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
                'glow': {
                    'from': { textShadow: '0 0 10px #ef233c, 0 0 20px #ef233c' },
                    'to': { textShadow: '0 0 20px #ef233c, 0 0 40px #ef233c, 0 0 60px #ef233c' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            backdropBlur: {
                'xs': '2px',
            },
        },
    },
    plugins: [],
}
