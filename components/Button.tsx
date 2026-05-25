import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn btn-primary",
  ghost: "btn btn-ghost",
  danger: "btn btn-ghost btn-danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    leadingIcon,
    trailingIcon,
    fullWidth,
    className,
    children,
    type = "button",
    style,
    ...rest
  },
  ref,
) {
  const classes = [
    VARIANT_CLASS[variant],
    size === "sm" ? "btn-sm" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyle = fullWidth ? { width: "100%", ...style } : style;

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={mergedStyle}
      {...rest}
    >
      {leadingIcon ? <span aria-hidden>{leadingIcon}</span> : null}
      <span>{loading ? "Saving…" : children}</span>
      {trailingIcon && !loading ? <span aria-hidden>{trailingIcon}</span> : null}
    </button>
  );
});
