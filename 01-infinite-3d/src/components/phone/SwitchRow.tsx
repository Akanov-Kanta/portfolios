"use client";
import { useId } from "react";

/** Safari 17.4+ renders <input type=checkbox switch> as a native switch (with its own haptic on iOS 18). */
const nativeSwitch = (el: HTMLInputElement | null) => {
  if (!el) return;
  el.setAttribute("switch", "");
  // feature-detect the rendering (the attribute itself is inert elsewhere): phone-hud.css styles the fallback track
  if ("switch" in el) el.dataset.native = "";
};

/**
 * One 48 px settings row of the Index sheet: a visible label and a real checkbox with role=switch.
 * `note` (e.g. 'Follows your system setting') is shown under the label and describes the switch.
 */
export function SwitchRow({
  label,
  checked,
  onChange,
  disabled = false,
  note,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <label className="ph-row ph-switch-row" data-disabled={disabled ? "" : undefined}>
      <span className="ph-switch-text">
        <span>{label}</span>
        {note && (
          <span id={noteId} className="marker marker-muted">
            {note}
          </span>
        )}
      </span>
      <input
        ref={nativeSwitch}
        type="checkbox"
        role="switch"
        className="ph-switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={note ? noteId : undefined}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    </label>
  );
}
