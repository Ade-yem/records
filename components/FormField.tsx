import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";

interface BaseFieldProps {
  label: string;
  hint?: string;
  error?: string;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <div id={hintId} style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
          {hint}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} role="alert" style={{ fontSize: "0.78rem", color: "var(--danger)", marginTop: 4, fontWeight: 600 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

type InputFieldProps = BaseFieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & { id?: string };

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, hint, error, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={fieldId}
        className="form-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        inputMode={rest.inputMode ?? (rest.type === "number" ? "decimal" : undefined)}
        {...rest}
      />
    </Field>
  );
});

type SelectFieldProps = BaseFieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { id?: string; children: ReactNode };

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Field id={fieldId} label={label} hint={hint} error={error}>
      <select
        ref={ref}
        id={fieldId}
        className="form-select"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
});

type TextareaFieldProps = BaseFieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & { id?: string };

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, hint, error, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const charCount = typeof rest.value === "string" ? rest.value.length : null;
  const showCounter = rest.maxLength != null && charCount !== null;
  return (
    <Field id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={fieldId}
        className="form-textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      {showCounter ? (
        <div
          style={{
            fontSize: "0.72rem",
            color: charCount! >= rest.maxLength! ? "var(--danger)" : "var(--text-muted)",
            textAlign: "right",
            marginTop: 3,
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {charCount}/{rest.maxLength}
        </div>
      ) : null}
    </Field>
  );
});
