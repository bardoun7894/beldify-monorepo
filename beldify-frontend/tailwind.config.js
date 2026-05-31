/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Static palette scales ─────────────────────────────────
        // NOTE: these names are inverted from Atlas semantics but are
        // consumed by existing components (button.tsx, PWA banners, etc.)
        // and MUST NOT be changed without a sweep of all consumers.
        // primary-*  = amber (existing consumers expect amber)
        // secondary-* = indigo (existing consumers expect indigo)
        primary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        secondary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // ── Atlas semantic layer (CSS-var driven) ─────────────────
        // Use these for new Atlas-aligned components and homepage port.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ── Atlas extended tokens ─────────────────────────────────
        // primary-container / on-primary-container / on-secondary /
        // on-surface / on-surface-variant / outline map 1-to-1 to Atlas spec.
        // All use the `/ <alpha-value>` form so opacity modifiers work
        // (e.g. ring-outline/20, text-on-surface-variant/70).
        "primary-container": "hsl(var(--primary-container) / <alpha-value>)",
        "on-primary-container": "hsl(var(--on-primary-container) / <alpha-value>)",
        "on-secondary": "hsl(var(--on-secondary) / <alpha-value>)",
        "on-surface": "hsl(var(--on-surface) / <alpha-value>)",
        "on-surface-variant": "hsl(var(--on-surface-variant) / <alpha-value>)",
        "outline": "hsl(var(--outline) / <alpha-value>)",
        // Alpha-aware Atlas brand colors — usable with opacity modifiers
        // (e.g. bg-atlas-primary/10). The numbered primary/secondary scales
        // above are the legacy inverted palette and lack a DEFAULT, so these
        // distinct keys give Tailwind a splittable color for opacity support.
        "atlas-primary": "hsl(var(--primary) / <alpha-value>)",
        "atlas-secondary": "hsl(var(--secondary) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        arabic: ["var(--font-arabic)"],
        heading: ["var(--font-heading)"],
        decorative: ["var(--font-decorative)"],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '7xl': ['4.5rem', { lineHeight: '1.1' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      borderRadius: {
        // Atlas radius scale: cards/hero = 16px (var(--radius) = 1rem)
        // buttons/inputs = 12px (calc(--radius) - 4px)
        lg: "var(--radius)",          /* 16px — cards, hero, modals */
        md: "calc(var(--radius) - 2px)", /* 14px — medium containers */
        sm: "calc(var(--radius) - 4px)", /* 12px — buttons, inputs, badges */
      },
      boxShadow: {
        // Atlas indigo-tinted shadows: large blur, low y-offset
        "atlas-sm": "0 2px 8px 0 hsl(240 39% 24% / 0.08)",
        "atlas-md": "0 4px 16px 0 hsl(240 39% 24% / 0.10)",
        "atlas-lg": "0 8px 32px 0 hsl(240 39% 24% / 0.12)",
        "atlas-xl": "0 12px 48px 0 hsl(240 39% 24% / 0.15)",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        progress: "progress 1.5s ease-in-out infinite",
        ping: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        progress: {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};
