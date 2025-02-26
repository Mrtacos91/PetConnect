/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Agrega aquí todas las variables de entorno que uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
