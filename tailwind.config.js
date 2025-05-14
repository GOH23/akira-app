module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        BackgroundColor: "var(--bg-color)",
        ForegroundColor: "var(--text-color)",
        ForegroundButton: "var(--fg-button-color)",
        BackgroundButton: "var(--bg-button-color)",
        BackgroundButtonDisabled: "var(--bg-button-disabled)",
        BackgroundHoverButton: "var(--bg-hover-button-color)",
        MenuItemBg: "var(--menu-layout-bg)"
      },
    },
  },
  content: [
    './src/**/*.{ts,tsx,html}'
  ],
  variants: {
    extend: {},
  },
  plugins: [],
}
