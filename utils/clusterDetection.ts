import { ThoughtNode, Cluster } from '../types';

/**
 * Detects clusters of strongly connected nodes using a community detection approach
 * Groups nodes with strong connections (weight > threshold) together
 */
export const detectClusters = (
  thoughts: ThoughtNode[],
  connectionThreshold: number = 0.6
): string[][] => {
  if (thoughts.length === 0) return [];

  const visited = new Set<string>();
  const clusters: string[][] = [];

  // Helper: DFS to find all strongly connected nodes
  const findCluster = (startId: string): string[] => {
    const cluster: string[] = [];
    const stack = [startId];

    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      cluster.push(nodeId);

      const node = thoughts.find(t => t.id === nodeId);
      if (!node) continue;

      // Find strongly connected neighbors
      for (const [connId, weight] of Object.entries(node.connections)) {
        if (weight >= connectionThreshold && !visited.has(connId)) {
          stack.push(connId);
        }
      }
    }

    return cluster;
  };

  // Find all clusters
  for (const thought of thoughts) {
    if (!visited.has(thought.id)) {
      const cluster = findCluster(thought.id);

      // Only consider groups of 2+ nodes as clusters
      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }
  }

  return clusters;
};

/**
 * Converts node ID groups to Cluster objects with positions
 */
export const buildClusters = (
  clusterGroups: string[][],
  thoughts: ThoughtNode[]
): Cluster[] => {
  return clusterGroups.map((nodeIds, index) => {
    const nodes = thoughts.filter(t => nodeIds.includes(t.id));

    // Calculate cluster center (center of gravity)
    const centerX = nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length;
    const centerY = nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length;

    return {
      id: `cluster-${index}`,
      nodeIds,
      summary: null, // Will be filled by AI
      centerX,
      centerY
    };
  });
};
