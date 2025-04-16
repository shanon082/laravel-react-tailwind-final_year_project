import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                  DEFAULT: "#3B82F6", // Blue for active links
                  hover: "#2563EB",
                },
              },
              animation: {
                pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              },
        },
    },

    plugins: [forms],
};
