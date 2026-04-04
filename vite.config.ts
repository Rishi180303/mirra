import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          { src: "public/manifest.json", dest: "." },
          { src: "public/icons/*", dest: "icons" },
        ],
      }),
    ],
    define: {
      "import.meta.env.VITE_FASHN_API_KEY": JSON.stringify(env.VITE_FASHN_API_KEY || ""),
      "import.meta.env.VITE_REPLICATE_API_TOKEN": JSON.stringify(env.VITE_REPLICATE_API_TOKEN || ""),
    },
    resolve: {
      alias: {
        "@mediapipe/pose": resolve(__dirname, "src/shims/mediapipe-pose.ts"),
      },
    },
    base: "",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          sidepanel: resolve(__dirname, "sidepanel.html"),
          background: resolve(__dirname, "src/background/background.ts"),
          content: resolve(__dirname, "src/content/content.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "assets/[name]-[hash].js",
        },
      },
    },
  };
});
