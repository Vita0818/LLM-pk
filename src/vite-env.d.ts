/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_PLAY_MODE?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
