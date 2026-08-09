export const theme = {
  color: {
    bg: '#0B0B0F',
    surface: '#16161D',
    surfaceAlt: '#1E1E27',
    border: '#2A2A35',
    text: '#F2F2F5',
    textMuted: '#9A9AA8',
    accent: '#FF4D6D',
    danger: '#FF6B6B',
  },
  space: (n: number) => n * 4,
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
  },
  font: {
    title: 17,
    body: 14,
    caption: 12,
  },
} as const;
