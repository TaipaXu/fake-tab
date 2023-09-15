import { resolve } from "path";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify';
import AutoImport from 'unplugin-auto-import/vite';
import copy from "rollup-plugin-copy";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    plugins: [
        vue(),
        vuetify(),
        AutoImport({
            imports: ['vue'],
            dts: resolve('src/@types', 'auto-imports.d.ts'),
        }),
        copy({
            targets: [
                { src: "src/manifest.json", dest: "dist", },
                { src: "src/assets", dest: "dist", },
            ],
            hook: "writeBundle",
        }),
    ],
    build: {
        rollupOptions: {
            input: ["popup.html"],
            output: {
                entryFileNames: "[name].js",
                dir: "dist",
            },
        },
    },
})
