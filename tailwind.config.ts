import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)", 
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'sparkle': 'sparkle 1s ease-in-out',
        'progress-celebration': 'progress-celebration 1s ease-in-out',
        'scale-bounce': 'scale-bounce 0.5s ease-in-out',
      },
    },
  },
  safelist: [
    'bg-white/60',
    'hover:bg-white/70',
    'backdrop-blur-sm',
    'from-blue-50',
    'via-white',
    'to-indigo-50',
    'from-blue-100',
    'via-indigo-50',
    'to-purple-50',
    'text-green-400',
    'text-blue-400',
    'text-red-400',
    {
      pattern: /bg-(slate|blue|green|red|indigo)-(50|100|200|300|400|500|600)/,
      variants: ['hover'],
    },
  ],
};

export default config;
