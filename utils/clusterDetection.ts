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
  const orphanNodes: string[] = [];

  for (const thought of thoughts) {
    if (!visited.has(thought.id)) {
      const cluster = findCluster(thought.id);

      // Only consider groups of 2+ nodes as clusters
      if (cluster.length >= 2) {
        clusters.push(cluster);
      } else if (cluster.length === 1) {
        // Collect orphan nodes (single nodes with no strong connections)
        orphanNodes.push(...cluster);
      }
    }
  }

  // If there are orphans, group them into an "Uncategorized" cluster
  if (orphanNodes.length > 0) {
    clusters.push(orphanNodes);
  }

  return clusters;
};

/**
 * Groups sub-clusters into major clusters based on spatial proximity
 * Ensures max 5 major clusters to avoid overwhelming the user
 */
export const groupIntoMetaClusters = (
  subClusters: Cluster[],
  maxMajorClusters: number = 5
): { majorClusters: Cluster[], subClusters: Cluster[] } => {
  if (subClusters.length === 0) return { majorClusters: [], subClusters: [] };
  if (subClusters.length <= maxMajorClusters) {
    // Few enough clusters - each becomes a major cluster
    return {
      majorClusters: subClusters.map((sc, i) => ({
        ...sc,
        id: `major-${i}`,
        level: 'major' as const,
        subClusterIds: [sc.id]
      })),
      subClusters: subClusters.map(sc => ({ ...sc, level: 'sub' as const, parentClusterId: `major-${subClusters.indexOf(sc)}` }))
    };
  }

  // Use k-means-like clustering based on spatial proximity
  const assigned = new Array(subClusters.length).fill(-1);
  const majorClusterCenters: { x: number, y: number, subClusterIds: string[], nodeIds: string[] }[] = [];

  // Initialize first k centers using k-means++ strategy
  const firstIndex = Math.floor(Math.random() * subClusters.length);
  majorClusterCenters.push({
    x: subClusters[firstIndex].centerX,
    y: subClusters[firstIndex].centerY,
    subClusterIds: [],
    nodeIds: []
  });

  // Pick remaining initial centers far from existing ones
  for (let i = 1; i < maxMajorClusters; i++) {
    let maxMinDist = -1;
    let farthestIndex = 0;

    for (let j = 0; j < subClusters.length; j++) {
      const minDist = Math.min(...majorClusterCenters.map(center => {
        const dx = subClusters[j].centerX - center.x;
        const dy = subClusters[j].centerY - center.y;
        return Math.sqrt(dx * dx + dy * dy);
      }));

      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        farthestIndex = j;
      }
    }

    majorClusterCenters.push({
      x: subClusters[farthestIndex].centerX,
      y: subClusters[farthestIndex].centerY,
      subClusterIds: [],
      nodeIds: []
    });
  }

  // Assign each sub-cluster to nearest major cluster
  for (let i = 0; i < subClusters.length; i++) {
    const sc = subClusters[i];
    let minDist = Infinity;
    let closestMajor = 0;

    for (let j = 0; j < majorClusterCenters.length; j++) {
      const center = majorClusterCenters[j];
      const dx = sc.centerX - center.x;
      const dy = sc.centerY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closestMajor = j;
      }
    }

    assigned[i] = closestMajor;
    majorClusterCenters[closestMajor].subClusterIds.push(sc.id);
    majorClusterCenters[closestMajor].nodeIds.push(...sc.nodeIds);
  }

  // Build final cluster structures
  const majorClusters: Cluster[] = majorClusterCenters.map((center, i) => ({
    id: `major-${i}`,
    nodeIds: center.nodeIds,
    summary: null, // Will be filled later
    centerX: center.x,
    centerY: center.y,
    level: 'major' as const,
    subClusterIds: center.subClusterIds
  }));

  const updatedSubClusters: Cluster[] = subClusters.map((sc, i) => ({
    ...sc,
    level: 'sub' as const,
    parentClusterId: `major-${assigned[i]}`
  }));

  return { majorClusters, subClusters: updatedSubClusters };
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
      id: `sub-${index}`,
      nodeIds,
      summary: null, // Will be filled by AI
      centerX,
      centerY,
      level: 'sub' as const // Start as sub-clusters
    };
  });
};
