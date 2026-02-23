/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WIT_AI_TOKEN: string;
    readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
