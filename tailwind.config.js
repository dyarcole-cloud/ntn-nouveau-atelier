/** @type {import('tailwindcss').Config} */
export default {
  // The single-file artifact used CDN Tailwind (JIT, arbitrary values like
  // text-[12px]). v3 JIT supports the same. Scan the entry HTML + all source.
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
