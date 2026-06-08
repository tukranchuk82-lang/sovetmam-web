import { getInitials } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.4);
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${shade(color, -25)})`,
        fontSize,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

// Затемняет/осветляет HEX-цвет на N процентов (для градиента в аватарке).
function shade(hex: string, percent: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map((x) => parseInt(x, 16));
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const to = (n: number) => Math.round((t - n) * p + n);
  const hex2 = (n: number) => to(n).toString(16).padStart(2, "0");
  return `#${hex2(r!)}${hex2(g!)}${hex2(b!)}`;
}
