import {defineConfig} from 'vite';

export default defineConfig({
  // Relative asset URLs: the same build works from /, from a GitHub Pages sub-path or a file server.
  base: './',
  build: {
    chunkSizeWarningLimit: 600, // the three.js chunk (~530 kB) is intentionally separate
    rolldownOptions: {
      output: {
        // three.js is ~500 kB and changes far less often than the game code, so keep it in its own
        // chunk: a game-only release leaves players' cached copy valid.
        codeSplitting: {groups: [{name: 'three', test: /node_modules\/three\//}]},
      },
    },
  },
});
