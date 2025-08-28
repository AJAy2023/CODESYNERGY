import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  plugins: [react(),
     tailwindcss()],
     resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        "@aceternity/ui": path.resolve(__dirname, "src/components/ui"),
      },
     },
})
