import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Injects a strict connect-src 'none' CSP header in production builds to enforce zero outbound requests. */
function zeroNetworkCspPlugin(): Plugin {
  return {
    name: 'zero-network-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; font-src 'self' data:;" />`
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), zeroNetworkCspPlugin()],
  test: {
    environment: 'node',
    globals: true,
  },
});
