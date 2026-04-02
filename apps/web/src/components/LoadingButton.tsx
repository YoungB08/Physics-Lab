import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function LoadingButton({
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...rest
}: Props) {
  const isDisabled = Boolean(disabled || loading);
  const text = loading && loadingText ? loadingText : children;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`button ${loading ? 'is-loading' : ''} ${className}`.trim()}
      aria-busy={loading ? 'true' : 'false'}
    >
      {leftIcon ? <span className="btn-icon">{leftIcon}</span> : null}
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      <span className="btn-text">{text}</span>
      {rightIcon ? <span className="btn-icon">{rightIcon}</span> : null}
    </button>
  );
}

