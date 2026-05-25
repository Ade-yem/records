import Image from "next/image";

interface AvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export function Avatar({ name, email, src, size = 80 }: AvatarProps) {
  const initials = getInitials(name, email);
  return (
    <div
      aria-label={name ?? email ?? "Avatar"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "white",
        color: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 800,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "Avatar"}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
