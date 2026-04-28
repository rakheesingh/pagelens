import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  badge?: string | number;
}

export interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  active: T;
  onChange: (next: T) => void;
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
}: TabsProps<T>): ReactNode {
  return (
    <div className="pl-tabs" role="tablist">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className="pl-tab"
            data-active={isActive ? "true" : "false"}
            onClick={() => onChange(item.id)}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== "" && (
              <span className="pl-tab__badge">{item.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
