// GENERATE RANDOM HEX CODES FOR AREA CHART
export function numberToHexColor(num: number): string {
  // Define hue ranges in degrees (HSL color wheel)
  // Allowed: purple(260°) → blue(240°) → green(120°) → yellow(60°)
  const allowedHueRanges: [number, number][] = [
    [60, 120], // Yellow → Green
    [180, 260], // Cyan → Purple
  ];

  // Pick hue range based on num
  const range = allowedHueRanges[num % allowedHueRanges.length];
  const hue = ((num * 37) % (range[1] - range[0])) + range[0];

  // Low saturation & high lightness for softness
  const saturation = 30 + (num % 20); // ~30–50% saturation
  const lightness = 70 + (num % 10); // ~70–80% lightness

  return hslToHex(hue, saturation, lightness);
}

// Helper: HSL → HEX
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))
    );

  return `#${f(0).toString(16).padStart(2, "0")}${f(8)
    .toString(16)
    .padStart(2, "0")}${f(4).toString(16).padStart(2, "0")}`;
}
