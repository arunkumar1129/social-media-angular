import PrimeUI from 'tailwindcss-primeui';

export default {
    content: [
        "./src/**/*.{html,ts,scss}",
    ],
    darkMode: 'app-dark-mode-class',
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [PrimeUI],
};