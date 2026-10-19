export interface InkGardenOptions {
  canvas: HTMLCanvasElement;
  /** hidden text field that receives keys (required when interactive) */
  input?: HTMLInputElement | null;
  /** CSS font-family of the letters (e.g. the next/font family) */
  font?: string;
  palette?: "night" | "scene" | "mist";
  mode?: "loop" | "type";
  /** phrase the loop types out */
  demoText?: string;
  interactive?: boolean;
  /** letter height as a fraction of the canvas height */
  sizeFrac?: number;
  /** max line width as a fraction of the canvas width */
  maxWFrac?: number;
  /** always break between words */
  wrapWords?: boolean;
  density?: number;
  /** ms the loop holds the grown phrase */
  hold?: number;
  startDelay?: number;
  caret?: boolean;
  maxLength?: number;
  onChange?: (text: string) => void;
  onEnter?: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

export interface InkGarden {
  setMode(mode: "loop" | "type"): void;
  text(): string;
  clear(): void;
  focus(): void;
  setActive(on: boolean): void;
  destroy(): void;
}

export function createInkGarden(opts: InkGardenOptions): InkGarden;
