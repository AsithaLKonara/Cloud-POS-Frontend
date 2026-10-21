import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manrope: ["'Manrope'", "sans-serif"],
        poppins: ["var(--font-poppins)"],
        inter: ["'Inter'", "sans-serif"],
        signature: ["var(--font-signature)", "sans-serif"],
        inria: ["var(--font-inria)", "serif"],
        urbanist: ["var(--font-urbanist)", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
        modern: ["'Plus Jakarta Sans'", "sans-serif"],
        ibm: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },
      colors: {
        obsidian: '#050706',
        carbon: '#0B100F',
        forest: '#11211B',
        'electric-emerald': '#00C987',
        'oxidized-teal': '#42C0C8',
        porcelain: '#F4F5F1',
        silversage: '#A5B1AA',
        graphite: '#26322C',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        muted: 'var(--muted)',
        border: 'var(--border)',
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        error: {
          DEFAULT: 'var(--error)',
          soft: 'var(--error-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
    },
  },
  plugins: [],
};
export default config;
