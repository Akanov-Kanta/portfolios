"use client";
import { Component, type ReactNode } from "react";
import { worldStore } from "./state/world-store";

/**
 * Catches anything the 3D world throws (a .glb that fails to load, renderer creation, a lazy chunk)
 * and drops to the static tier, so the CSS WorldFallback stays up and the DOM content survives.
 */
export class WorldErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[world] disabled after an error:", error);
    worldStore.getState().set({ tier: "static", webglReady: false, mounting: false });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
