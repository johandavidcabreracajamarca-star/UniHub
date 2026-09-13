import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  children: ReactNode;
}

function FieldWrapper({ label, error, success, hint, children }: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
      {!error && success && <span className="mt-1 block text-xs text-green-600">{success}</span>}
      {!error && !success && hint && <span className="mt-1 block text-xs text-ink/40">{hint}</span>}
    </label>
  );
}

const baseFieldClass =
  'w-full rounded-control border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 min-h-[44px]';

interface BaseFieldProps {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  success,
  hint,
  className = '',
  rightElement,
  ...rest
}: BaseFieldProps & InputHTMLAttributes<HTMLInputElement> & { rightElement?: ReactNode }) {
  return (
    <FieldWrapper label={label} error={error} success={success} hint={hint}>
      <div className="relative">
        <input
          className={`${baseFieldClass} ${rightElement ? 'pr-10' : ''} ${
            error ? 'border-red-400' : success ? 'border-green-400' : ''
          } ${className}`}
          {...rest}
        />
        {rightElement && <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
    </FieldWrapper>
  );
}

export function Textarea({
  label,
  error,
  hint,
  className = '',
  ...rest
}: BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea
        className={`${baseFieldClass} min-h-[96px] resize-none ${error ? 'border-red-400' : ''} ${className}`}
        {...rest}
      />
    </FieldWrapper>
  );
}

export function Select({
  label,
  error,
  hint,
  className = '',
  children,
  ...rest
}: BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <select className={`${baseFieldClass} ${error ? 'border-red-400' : ''} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}
