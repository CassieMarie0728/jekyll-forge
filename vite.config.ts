import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "forge-public-welcome",
      generateBundle() {
        for (const file of ["index.html", "forge.css", "favicon.svg"]) {
          this.emitFile({
            type: "asset",
            fileName: `welcome/${file}`,
            source: readFileSync(
              path.resolve(import.meta.dirname, "landing", file)
            ),
          });
        }
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = req.url?.split("?")[0];
          const file =
            pathname === "/welcome/" || pathname === "/welcome"
              ? "index.html"
              : pathname?.replace(/^\/welcome\//, "");
          if (
            !pathname?.startsWith("/welcome") ||
            !file ||
            !["index.html", "forge.css", "favicon.svg"].includes(file)
          )
            return next();
          res.setHeader(
            "Content-Type",
            file.endsWith("css")
              ? "text/css"
              : file.endsWith("svg")
                ? "image/svg+xml"
                : "text/html; charset=utf-8"
          );
          res.end(
            readFileSync(path.resolve(import.meta.dirname, "landing", file))
          );
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client/public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    reportCompressedSize: false,
    cssCodeSplit: true,
  },
  server: { host: "127.0.0.1", proxy: { "/api": "http://localhost:8787" } },
});
