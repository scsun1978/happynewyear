/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cloud-primary': '#0052D9', // Brand Blue
                'cloud-secondary': '#E34D59',
                'tech-dark': '#1a1a1a',
                'festival-red': '#C31F26', // Chine Red
                'festival-gold': '#FAD577', // Gold
            }
        },
    },
    plugins: [],
}
