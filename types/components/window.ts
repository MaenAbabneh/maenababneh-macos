import type { AppWindow, GitHubProjectSummary } from "@/types";

export type AppWindowContentProps = {
  isDarkMode?: boolean;
  project?: GitHubProjectSummary | null;
};

export interface WindowProps {
  window: AppWindow;
  isActive: boolean;
  windowId: string;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface DragState {
  x: number;
  y: number;
}

export interface ResizeState {
  x: number;
  y: number;
}

export interface DockTarget {
  el: HTMLElement;
  cleanup?: () => void;
}
