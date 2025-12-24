export interface ThoughtNode {
  id: string;
  content: string;

  // Physics State (2D)
  x: number;
  y: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  mass: number;

  connections: { [id: string]: number }; // Weighted connections (id -> strength 0-1)
  color: string; // Vibe Color
  gradient: string; // CSS Gradient
  createdAt: number;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  gradient: string;
  description: string;
}

export interface SparkResponse {
  thinkerId: string;
  text: string;
}

export interface GroupSummary {
  theme: string;
  description: string;
}

export interface ViewState {
  x: number;
  y: number;
  zoom: number;
}