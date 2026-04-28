export interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}

export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <label className="pl-toggle">
      <span className="pl-toggle__track" data-on={on ? "true" : "false"}>
        <span className="pl-toggle__thumb" />
      </span>
      {label && <span>{label}</span>}
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
    </label>
  );
}
