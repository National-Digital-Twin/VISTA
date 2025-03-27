import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import graphqlLoader from "vite-plugin-graphql-loader";
import { resolve } from "path";
import tailwindcss from "tailwindcss";

export default defineConfig({
  plugins: [react(), graphqlLoader()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      // Transparent proxy
      "/transparent-proxy": {
        target: "http://localhost:5013",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/transparent-proxy/, ""),
        secure: false,
      },
      // Coefficent python
      "/ndtp-python": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ndtp-python/, ""),
        secure: false,
      },
      // Ontology proxy
      "/ontology-proxy": {
        target: "http://localhost:3030",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ontology-proxy/, ""),
        secure: false,
      },
    },
  },
});
