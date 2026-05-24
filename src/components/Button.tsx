import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ children, className = '', tone = 'secondary', size = 'md', ...props }: ButtonProps) {
  return (
    <button className={`button button--${tone} button--${size} ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}
