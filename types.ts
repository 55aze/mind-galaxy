export interface ThoughtNode {
  id: string;
  content: string;
  
  // Physics State
  x: number;
  y: number;
  z: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  vz: number; // Velocity Z
  mass: number;

  connections: string[]; // The Rhizome Links
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
  z: number;
  rotationX: number;
  rotationY: number;
}