// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind'; // ✅ este es el plugin correcto
import react from '@astrojs/react';

export default defineConfig({
  integrations: [
    tailwind(), // ✅ aquí va Tailwind
    react()
  ]
});

