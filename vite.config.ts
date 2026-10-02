import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

/**
 * One Vite project, two environments: the Worker (server rendering, APIs, photographs from R2) and
 * the client (storefront and admin scripts and styles). In development the Worker runs in workerd
 * with local D1 and R2 (.wrangler/state); nothing touches Cloudflare until a deploy.
 *
 * Entry files keep stable names (the Worker's HTML references them with ?v=<build id>); shared
 * chunks and other assets are content-hashed and cached forever.
 */
const ENTRY_CSS = new Set(['styles.css', 'admin-styles.css']);

export default defineConfig({
  plugins: [cloudflare()],
  // raw sources and tools are never served: a file being written there (a download, a probe) used
  // to crash the dev server's watcher with EBUSY on Windows
  server: { port: 3640, strictPort: true, host: '127.0.0.1', watch: { ignored: ['**/raw/**', '**/tools/**', '**/.impeccable/**'] } },
  preview: { port: 3641, strictPort: true },
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  environments: {
    client: {
      build: {
        target: 'es2022',
        sourcemap: false,
        rollupOptions: {
          input: {
            app: 'src/client/main.ts',
            styles: 'src/client/styles/index.css',
            admin: 'src/admin/main.ts',
            'admin-styles': 'src/admin/admin.css',
          },
          output: {
            entryFileNames: 'entry/[name].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: (a) => {
              const name = a.names?.[0] ?? '';
              return ENTRY_CSS.has(name) ? 'entry/[name][extname]' : 'assets/[name]-[hash][extname]';
            },
          },
        },
      },
    },
  },
});
