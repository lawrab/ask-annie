/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /*
       * =======================================================================
       * SOFT DAWN DESIGN SYSTEM
       * "The quiet moment of a new morning"
       *
       * All color combinations meet WCAG AA standards (4.5:1 for text, 3:1 for UI)
       * Reference: docs/soft-dawn-design-brief.md
       * =======================================================================
       */
      colors: {
        // Primary Colors
        cream: {
          DEFAULT: '#FDF8F3', // Main background - warm paper feel
          dark: '#F5EBE6',    // Gentle blush for gradients
        },
        rose: {
          DEFAULT: '#E8C4B8', // Primary accent, buttons, highlights
          hover: '#DFBAA8',
          50: '#FDF8F6',
          100: '#FAF0EC',
          200: '#F5E1D9',
          300: '#E8C4B8',     // Main rose
          400: '#D9A899',
          500: '#C98B7A',
        },
        sage: {
          DEFAULT: '#4A6741', // Links, interactive elements (6.0:1 on cream)
          light: '#B5C4B1',   // Decorative only
          50: '#F4F7F3',
          100: '#E8EFE6',
          200: '#D1DFCD',
          300: '#B5C4B1',
          400: '#7A9B70',
          500: '#4A6741',     // Main sage
          600: '#3D5536',
        },
        // Text Colors
        walnut: {
          DEFAULT: '#3D3631', // Body text (11.2:1 on cream - AAA)
          muted: '#6B635C',   // Secondary text (5.6:1 on cream - AA)
          50: '#F7F6F5',
          100: '#EFEEED',
          200: '#D9D6D4',
          300: '#B3ADAA',
          400: '#8C847E',
          500: '#6B635C',
          600: '#3D3631',
        },
        // Accent & UI Colors
        terracotta: {
          DEFAULT: '#A65D45', // CTA buttons (4.9:1 with white - AA)
          hover: '#954F3A',
          light: '#C4836A',   // Decorative only
          50: '#FBF6F4',
          100: '#F5EBE6',
          200: '#E8D1C7',
          300: '#D4A899',
          400: '#C4836A',
          500: '#A65D45',
          600: '#954F3A',
        },
        mist: {
          DEFAULT: '#E5E1EC', // Card backgrounds, dividers
          50: '#F8F7FA',
          100: '#F1EFF5',
          200: '#E5E1EC',
          300: '#D4CED9',
        },
        honey: {
          DEFAULT: '#8B6914', // Warnings, pattern insights (5.2:1 on cream - AA)
          light: '#D4A574',   // Decorative only
          50: '#FDF9F0',
          100: '#FAF1DC',
          200: '#F2DFB4',
          300: '#D4A574',
          400: '#B88A42',
          500: '#8B6914',
        },
        coral: {
          DEFAULT: '#E07A5F', // Recording animation (decorative only)
        },

        // Keep gray for compatibility but prefer walnut for text
        gray: {
          50: '#FDF8F3',   // Map to cream for compatibility
          100: '#F5EBE6',
          200: '#E5E1EC',  // Map to mist
          300: '#D4CED9',
          400: '#8C847E',
          500: '#6B635C',  // Map to walnut-muted
          600: '#574F4A',
          700: '#453E3A',
          800: '#3D3631',  // Map to walnut
          900: '#2D2926',
          950: '#1A1816',
        },

        // Legacy mappings for gradual migration
        // (components can still use primary-600 etc. while being updated)
        primary: {
          50: '#FDF8F6',
          100: '#FAF0EC',
          200: '#F5E1D9',
          300: '#E8C4B8',
          400: '#D9A899',
          500: '#C98B7A',
          600: '#A65D45',  // Map to terracotta for CTAs
          700: '#954F3A',
          800: '#7A4130',
          900: '#5F3226',
          950: '#3D1F17',
        },
        secondary: {
          50: '#F4F7F3',
          100: '#E8EFE6',
          200: '#D1DFCD',
          300: '#B5C4B1',
          400: '#7A9B70',
          500: '#5A7D50',
          600: '#4A6741',  // Map to sage
          700: '#3D5536',
          800: '#32442C',
          900: '#283622',
          950: '#1A2316',
        },
      },
      fontFamily: {
        // Literata for headlines - journal/book feel
        serif: ['Literata', 'Georgia', 'serif'],
        // Inter for body text - humanist sans-serif
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Caveat for optional accent (taglines, quotes)
        accent: ['Caveat', 'cursive'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Keep existing accessible font sizes
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        // Soft, organic shapes - not mechanical
        none: '0',
        sm: '0.25rem',    // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem',    // 12px
        lg: '1rem',       // 16px - primary for buttons
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px - primary for cards
        '3xl': '2rem',    // 32px
        full: '9999px',
      },
      boxShadow: {
        // Soft shadows - natural light feel, not harsh drop shadows
        soft: '0 2px 8px rgba(61, 54, 49, 0.06)',
        card: '0 4px 16px rgba(61, 54, 49, 0.08)',
        lifted: '0 8px 24px rgba(61, 54, 49, 0.10)',
        // Keep existing for compatibility
        sm: '0 1px 2px 0 rgba(61, 54, 49, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(61, 54, 49, 0.1), 0 1px 2px -1px rgba(61, 54, 49, 0.1)',
        md: '0 4px 6px -1px rgba(61, 54, 49, 0.1), 0 2px 4px -2px rgba(61, 54, 49, 0.1)',
        lg: '0 10px 15px -3px rgba(61, 54, 49, 0.1), 0 4px 6px -4px rgba(61, 54, 49, 0.1)',
        xl: '0 20px 25px -5px rgba(61, 54, 49, 0.1), 0 8px 10px -6px rgba(61, 54, 49, 0.1)',
        '2xl': '0 25px 50px -12px rgba(61, 54, 49, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(61, 54, 49, 0.05)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      ringWidth: {
        DEFAULT: '2px',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
      animation: {
        'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gentle': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
