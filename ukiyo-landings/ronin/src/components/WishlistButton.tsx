"use client";

import { useState } from "react";

/** Fictional wishlist CTA — flips to a stamped "added" state. */
export function WishlistButton({
  label = "Add to wishlist",
  className = "",
  shadow = "ink",
}: {
  label?: string;
  className?: string;
  shadow?: "ink" | "crimson";
}) {
  const [added, setAdded] = useState(false);
  return (
    <span className={`btn-wrap ${shadow === "crimson" ? "shadow-crimson" : ""} ${className}`}>
      <button
        type="button"
        className={`btn ${added ? "btn-ink" : "btn-blade"}`}
        aria-pressed={added}
        onClick={() => setAdded((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          {added ? (
            <path d="M3 10l5 5L17 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
          ) : (
            <path d="M2 18L16 4M12 2l6 6M4 13l3 3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" fill="none" />
          )}
        </svg>
        <span>{added ? "On your wishlist" : label}</span>
      </button>
    </span>
  );
}
