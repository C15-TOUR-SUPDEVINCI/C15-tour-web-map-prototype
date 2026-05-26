export const API_URL = import.meta.env.VITE_API_URL ?? 'https://c15-tour-back.vercel.app';

if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
    console.warn('[config] VITE_API_URL is not set — falling back to the production API URL.');
}
