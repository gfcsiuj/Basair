/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                'ui': ['Rubik', 'sans-serif'],
                'display': ['Tajawal', 'sans-serif'],
                'digital': ['Changa', 'sans-serif'],
            },
            colors: {
                primary: 'var(--primary)',
                'primary-light': 'var(--primary-light)',
                'primary-dark': 'var(--primary-dark)',
                secondary: 'var(--secondary)',
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                border: 'var(--border)',
            },
            keyframes: {
                fadeIn: { 'from': { opacity: 0, transform: 'scale(0.98)' }, 'to': { opacity: 1, transform: 'scale(1)' } },
                fadeOut: { 'from': { opacity: 1, transform: 'scale(1)' }, 'to': { opacity: 0, transform: 'scale(0.98)' } },
                slideInUp: { 'from': { transform: 'translateY(100%)', opacity: 0 }, 'to': { transform: 'translateY(0)', opacity: 1 } },
                slideOutDown: { 'from': { transform: 'translateY(0)', opacity: 1 }, 'to': { transform: 'translateY(100%)', opacity: 0 } },
                slideInDown: { 'from': { transform: 'translateY(-100%)', opacity: 0 }, 'to': { transform: 'translateY(0)', opacity: 1 } },
                slideOutUp: { 'from': { transform: 'translateY(0)', opacity: 1 }, 'to': { transform: 'translateY(-100%)', opacity: 0 } },
                scaleIn: { 'from': { transform: 'scale(0.95)', opacity: 0 }, 'to': { transform: 'scale(1)', opacity: 1 } },
                scaleOut: { 'from': { transform: 'scale(0.95)', opacity: 1 }, 'to': { transform: 'scale(1)', opacity: 0 } },
                pageTransition: { 'from': { opacity: 0, transform: 'translateY(10px)' }, 'to': { opacity: 1, transform: 'translateY(0)' } },
                listItemEnter: { 'from': { opacity: 0, transform: 'translateY(10px)' }, 'to': { opacity: 1, transform: 'translateY(0)' } },
                pulseWaiting: {
                    '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(139, 69, 189, 0.4)' },
                    '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(139, 69, 189, 0)' }
                },
                pulseIcon: {
                    '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    '50%': { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0.8 },
                },
            },
            animation: {
                fadeIn: 'fadeIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                fadeOut: 'fadeOut 0.2s cubic-bezier(0.895, 0.03, 0.685, 0.22) forwards',
                slideInUp: 'slideInUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                slideOutDown: 'slideOutDown 0.3s cubic-bezier(0.895, 0.03, 0.685, 0.22) forwards',
                slideInDown: 'slideInDown 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                slideOutUp: 'slideOutUp 0.3s cubic-bezier(0.895, 0.03, 0.685, 0.22) forwards',
                scaleIn: 'scaleIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                scaleOut: 'scaleOut 0.2s cubic-bezier(0.895, 0.03, 0.685, 0.22) forwards',
                pageTransition: 'pageTransition 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                listItemEnter: 'listItemEnter 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards',
                pulseWaiting: 'pulseWaiting 2s infinite',
                pulseIcon: 'pulseIcon 1.5s infinite ease-in-out',
            }
        }
    }
}
