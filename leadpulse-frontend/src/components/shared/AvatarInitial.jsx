"use client";

// ── Avatar gradient pools ─────────────────────────────────────
const AVATAR_GRADIENTS = [
  ["#6366f1", "#818cf8"],
  ["#8b5cf6", "#a78bfa"],
  ["#0ea5e9", "#38bdf8"],
  ["#10b981", "#34d399"],
  ["#f59e0b", "#fbbf24"],
  ["#ef4444", "#f87171"],
  ["#14b8a6", "#2dd4bf"],
  ["#f97316", "#fb923c"],
];

/**
 * AvatarInitial — Circular avatar showing the first letter of a name/email
 *
 * Props:
 *   name    {string}  - full name or email to derive initial from
 *   index   {number}  - row index used to cycle gradient colors
 *   size    {number}  - diameter in px (default 28)
 */
export default function AvatarInitial({ name = "", index = 0, size = 28 }) {
  const initial = (name?.[0] || "?").toUpperCase();
  const [from, to] = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <div
      className="lp-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize: size * 0.36,
      }}
      title={name}
    >
      {initial}
    </div>
  );
}
