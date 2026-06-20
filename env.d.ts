/// <reference types="vite-plus/client" />
/// <reference types="chrome" />

declare module '*.vue' {
    import type { Component } from 'vue';
    const component: Component;
    export default component;
}
