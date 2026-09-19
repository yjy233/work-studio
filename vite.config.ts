import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'editor', test: /node_modules.*(?:codemirror|@lezer|@uiw)/, priority: 2 },
            {
              name: 'markdown',
              test: /node_modules.*(?:remark|rehype|lowlight|highlight\.js|micromark|mdast|hast|unist|unified)/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});
