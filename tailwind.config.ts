import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      // Mobile-first breakpoint system (Expert Council consensus)
      'sm': '640px',   // Mobile landscape, small tablets
      'md': '768px',   // Tablets portrait
      'lg': '1024px',  // Tablets landscape, small desktops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large desktops
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Communitee Control Hub Brand Colors
        "chub-success": "hsl(var(--success))",
        "chub-warning": "hsl(var(--warning))",
        "chub-accent-start": "hsl(var(--accent-gradient-start))",
        "chub-accent-end": "hsl(var(--accent-gradient-end))",
        // Direct brand color access
        "chub-dark-bg": "#0a0b1f",
        "chub-dark-bg-end": "#002bff",
        "chub-light-bg": "#ffffff",
        "chub-dark-text": "#ffffff",
        "chub-light-text": "#000000",
        "chub-accent-blue": "#003cff",
        "chub-accent-blue-end": "#0066ff",
        "chub-success-green": "#22c55e",
        "chub-error-red": "#ef4444",
        "chub-warning-yellow": "#FAAD14",
        "chub-neutral": "#9ca3af",
        "chub-light-border": "#e5e7eb",
        "chub-dark-border": "#374151",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Touch-friendly spacing utilities (WCAG 2.1 AAA compliance)
        'touch-sm': '44px',  // Minimum touch target size
        'touch-md': '48px',  // Recommended touch target size
        'touch-lg': '56px',  // Large touch target size for primary actions
        'touch-xl': '64px',  // Extra large touch target size
      },
      minHeight: {
        // Touch target minimum heights
        'touch': '44px',
        'touch-md': '48px',
        'touch-lg': '56px',
      },
      minWidth: {
        // Touch target minimum widths
        'touch': '44px',
        'touch-md': '48px',
        'touch-lg': '56px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
