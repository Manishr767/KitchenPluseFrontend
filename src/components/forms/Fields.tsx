import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { useId } from 'react'

const CONTROL =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50 disabled:text-gray-500'

function Wrapper({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: string
  trailing?: ReactNode
}

export function TextField({ label, error, hint, trailing, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${CONTROL} ${error ? 'border-red-400' : 'border-gray-300'} ${trailing ? 'pr-11' : ''} ${className}`}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>}
      </div>
    </Wrapper>
  )
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  error?: string
  hint?: string
}

export function SelectField({ label, error, hint, children, className = '', ...rest }: SelectFieldProps) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </Wrapper>
  )
}

/** Compact select used in filter bars (no label wrapper). */
export function FilterSelect({
  label,
  className = '',
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <select
      aria-label={label}
      className={`h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${className}`}
      {...rest}
    />
  )
}
