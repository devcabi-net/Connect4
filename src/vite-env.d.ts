/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_CLIENT_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_FORCE_DISCORD_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
