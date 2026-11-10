// RCM Holdings Tailwind preset — add to tailwind.config: presets: [require('./tailwind.rcm.cjs')]
module.exports = {
  theme: {
    extend: {
      colors: {
        rcm: {
          "navy": "#0B1D3A",
          "graphite": "#2B2F36",
          "stone": "#E6E7E9",
          "orange": "#FF4A00",
          "white": "#FFFFFF",
          "navy-80": "#3C4A61",
          "navy-60": "#6D7789",
          "navy-40": "#9DA5B0",
          "navy-20": "#CED2D8",
          "navy-10": "#E7E8EB",
          "graphite-75": "#606368",
          "graphite-50": "#95979A",
          "graphite-25": "#CACBCD",
          "graphite-10": "#EAEAEB",
          "stone-50": "#F2F3F4",
          "orange-80": "#FF6E33",
          "orange-60": "#FF9266",
          "orange-40": "#FFB799",
          "orange-20": "#FFDBCC"
        },
      },
      fontFamily: {
        'rcm-primary': ['Aktiv Grotesk', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'rcm-secondary': ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: { eyebrow: '0.18em' },
    },
  },
};
