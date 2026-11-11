type Tone = 'ok' | 'warn' | 'danger' | 'muted';

type Props = {
  tone?: Tone;
  label?: string;
  title?: string;
  className?: string;
};

export function StatusDot({ tone = 'muted', label, title, className }: Props) {
  return (
    <span
      className={`status-dot status-dot--${tone}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label={label}
      title={title ?? label}
    />
  );
}
