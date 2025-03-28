// SVG Pattern as Base64 to avoid external file dependencies
export const backgroundPattern = `data:image/svg+xml;base64,${btoa(`
  <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(33, 150, 243, 0.08)" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="2" fill="rgba(33, 150, 243, 0.08)"/>
        <circle cx="50" cy="0" r="2" fill="rgba(33, 150, 243, 0.08)"/>
        <circle cx="0" cy="50" r="2" fill="rgba(33, 150, 243, 0.08)"/>
        <circle cx="25" cy="25" r="1.5" fill="rgba(33, 150, 243, 0.08)"/>
      </pattern>
    </defs>
    <rect width="50" height="50" fill="url(#gridPattern)"/>
  </svg>
`)}`;

// Common background style properties that can be reused
export const commonBackgroundStyle = {
  content: '""',
  position: "absolute" as const,
  top: "-50%",
  left: "-50%",
  right: "-50%",
  bottom: "-50%",
  backgroundImage: `url("${backgroundPattern}")`,
  backgroundRepeat: "repeat",
  transform: "rotate(-10deg) scale(1.2)",
  animation: "moveBackground 40s linear infinite",
  zIndex: 0,
};

// Common keyframes for the background animation
export const moveBackgroundKeyframes = {
  "0%": {
    transform: "rotate(-10deg) scale(1.2) translateY(0)",
  },
  "100%": {
    transform: "rotate(-10deg) scale(1.2) translateY(-25%)",
  },
}; 