"use client";
import { useEffect } from "react";
import type { Camera, Vector3 } from "three";
import type { StationId } from "../state/world-store";

/**
 * Registry for igloo-style data labels: 3D anchor points that get a DOM label + leader line.
 * Scenes register anchors; the DOM overlay projects them every frame (ticker priority +10).
 */
export interface LabelDef {
  id: string;
  /** stations where the label is shown */
  station: StationId[];
  world: Vector3 | (() => Vector3);
  side: "left" | "right";
  lines: () => string[];
}

export const labelsState: { camera: Camera | null; defs: Map<string, LabelDef>; version: number; listeners: Set<() => void>} = {
  camera: null,
  defs: new Map(),
  version: 0,
  listeners: new Set(),
};


function bump() {
  labelsState.version++;
  labelsState.listeners.forEach((l) => l());
}

export function useLabels(defs: LabelDef[]) {
  useEffect(() => {
    defs.forEach((d) => labelsState.defs.set(d.id, d));
    bump();
    return () => {
      defs.forEach((d) => labelsState.defs.delete(d.id));
      bump();
    };
  }, [defs]);
}
