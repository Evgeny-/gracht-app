type ToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      aria-pressed={checked}
      className="toggle"
      data-checked={checked}
      type="button"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      <span>{label}</span>
    </button>
  );
}
