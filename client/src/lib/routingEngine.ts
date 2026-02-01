import airportData from '@/data/airport.json';

export interface RoutePoint {
  x: number;
  y: number;
  name: string;
  poiId?: string;
  type: 'gate' | 'poi' | 'corridor';
}

export interface RouteSegment {
  from: RoutePoint;
  to: RoutePoint;
  distance: number;
  polyline: [number, number][];
}

export interface RoutingResult {
  totalDistance: number;
  stops: RoutePoint[];
  segments: RouteSegment[];
  polyline: [number, number][];
  preferences: {
    visited: string[];
    skipped: string[];
  };
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  name: string;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

interface POILink {
  poiId: string;
  nodeId: string;
  weight: number;
}

interface POI {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  zone: string;
}

// Euclidean distance heuristic for A*
function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Parse user preferences from text input
export function parsePreferences(text: string): {
  mustVisit: string[];
  optionalVisit: string[];
  maxStops: number;
  maxDetourCost: number;
} {
  const textLower = text.toLowerCase();
  const mustVisit: string[] = [];
  const optionalVisit: string[] = [];

  // Check for WC/restroom mentions
  if (textLower.includes('wc') || textLower.includes('restroom') || textLower.includes('bathroom') || textLower.includes('toilet')) {
    mustVisit.push('wc');
  }

  // Check for cafe mentions
  if (textLower.includes('cafe') || textLower.includes('coffee') || textLower.includes('drink')) {
    optionalVisit.push('cafe');
  }

  // Check for shop mentions
  if (textLower.includes('shop') || textLower.includes('shopping') || textLower.includes('buy')) {
    optionalVisit.push('shop');
  }

  // Check for restaurant mentions
  if (textLower.includes('hungry') || textLower.includes('eat') || textLower.includes('food') || textLower.includes('restaurant')) {
    optionalVisit.push('restaurant');
  }

  return {
    mustVisit,
    optionalVisit,
    maxStops: 2,
    maxDetourCost: 300,
  };
}

// A* algorithm for pathfinding
function aStar(
  startId: string,
  endId: string,
  nodes: Map<string, GraphNode>,
  edges: Map<string, GraphEdge[]>,
  heuristic: (id: string) => number
): { path: string[]; cost: number } {
  const openSet = new Set<string>([startId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  nodes.forEach((_, id) => {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
  });

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId));

  while (openSet.size > 0) {
    let current = '';
    let minF = Infinity;

    openSet.forEach((id) => {
      const f = fScore.get(id) ?? Infinity;
      if (f < minF) {
        minF = f;
        current = id;
      }
    });

    if (current === endId) {
      const path: string[] = [current];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current)!;
        path.unshift(current);
      }
      return { path, cost: gScore.get(endId) ?? 0 };
    }

    openSet.delete(current);

    const neighbors = edges.get(current) ?? [];
    for (const edge of neighbors) {
      const neighbor = edge.to;
      const tentativeGScore = (gScore.get(current) ?? 0) + edge.weight;

      if (tentativeGScore < (gScore.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor));

        if (!openSet.has(neighbor)) {
          openSet.add(neighbor);
        }
      }
    }
  }

  return { path: [], cost: Infinity };
}

// Main routing function
export function computeRoute(
  arrivalGateId: string,
  departureGateId: string,
  userPreferencesText: string
): RoutingResult {
  const preferences = parsePreferences(userPreferencesText);

  // Build graph from airport data
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge[]>();
  const poiMap = new Map<string, POI>();
  const poiLinkMap = new Map<string, string>(); // poiId -> nodeId

  // Add corridor nodes
  airportData.navGraph.nodes.forEach((node) => {
    nodes.set(node.id, node);
    edges.set(node.id, []);
  });

  // Add POI nodes
  airportData.pois.forEach((poi) => {
    poiMap.set(poi.id, poi);
    nodes.set(`poi:${poi.id}`, {
      id: `poi:${poi.id}`,
      x: poi.x,
      y: poi.y,
      name: poi.name,
    });
    edges.set(`poi:${poi.id}`, []);
  });

  // Add corridor edges (bidirectional)
  airportData.navGraph.edges.forEach((edge) => {
    const fromEdges = edges.get(edge.from) ?? [];
    const toEdges = edges.get(edge.to) ?? [];

    fromEdges.push({ from: edge.from, to: edge.to, weight: edge.weight });
    toEdges.push({ from: edge.to, to: edge.from, weight: edge.weight });

    edges.set(edge.from, fromEdges);
    edges.set(edge.to, toEdges);
  });

  // Add POI links
  airportData.navGraph.poiLinks.forEach((link) => {
    const poiNodeId = `poi:${link.poiId}`;
    const corridorNodeId = link.nodeId;

    poiLinkMap.set(link.poiId, corridorNodeId);

    const poiEdges = edges.get(poiNodeId) ?? [];
    const corridorEdges = edges.get(corridorNodeId) ?? [];

    poiEdges.push({ from: poiNodeId, to: corridorNodeId, weight: link.weight });
    corridorEdges.push({ from: corridorNodeId, to: poiNodeId, weight: link.weight });

    edges.set(poiNodeId, poiEdges);
    edges.set(corridorNodeId, corridorEdges);
  });

  // Find candidate POIs for preferences
  const candidatePOIs: POI[] = [];
  airportData.pois.forEach((poi) => {
    if (preferences.mustVisit.includes(poi.category) || preferences.optionalVisit.includes(poi.category)) {
      candidatePOIs.push(poi);
    }
  });

  // Compute direct route (baseline)
  const startNodeId = `poi:${arrivalGateId}`;
  const endNodeId = `poi:${departureGateId}`;

  const endNode = nodes.get(endNodeId);
  if (!endNode) {
    return {
      totalDistance: 0,
      stops: [],
      segments: [],
      polyline: [],
      preferences: { visited: [], skipped: [] },
    };
  }

  const heuristic = (id: string) => {
    const node = nodes.get(id);
    if (!node) return 0;
    return euclideanDistance(node.x, node.y, endNode.x, endNode.y);
  };

  const directRoute = aStar(startNodeId, endNodeId, nodes, edges, heuristic);
  const directDistance = directRoute.cost;

  // Select preference POIs to visit
  const visitedPOIs: POI[] = [];
  const skippedPOIs: string[] = [];

  // Must-visit categories
  for (const category of preferences.mustVisit) {
    const poiInCategory = candidatePOIs.find((p) => p.category === category && !visitedPOIs.includes(p));
    if (poiInCategory) {
      visitedPOIs.push(poiInCategory);
    }
  }

  // Optional categories (if within detour cost and max stops)
  for (const category of preferences.optionalVisit) {
    if (visitedPOIs.length >= preferences.maxStops) break;

    const poiInCategory = candidatePOIs.find((p) => p.category === category && !visitedPOIs.includes(p));
    if (poiInCategory) {
      visitedPOIs.push(poiInCategory);
    }
  }

  // Build route with preference stops
  let fullPath: string[] = [startNodeId];
  let totalCost = 0;

  if (visitedPOIs.length > 0) {
    // Route through preference POIs
    let currentId = startNodeId;

    for (const poi of visitedPOIs) {
      const poiNodeId = `poi:${poi.id}`;
      const segment = aStar(currentId, poiNodeId, nodes, edges, heuristic);
      fullPath = [...fullPath.slice(0, -1), ...segment.path];
      totalCost += segment.cost;
      currentId = poiNodeId;
    }

    // Final segment to departure gate
    const finalSegment = aStar(currentId, endNodeId, nodes, edges, heuristic);
    fullPath = [...fullPath.slice(0, -1), ...finalSegment.path];
    totalCost += finalSegment.cost;
  } else {
    // Direct route
    fullPath = directRoute.path;
    totalCost = directDistance;
  }

  // Convert path to route points and segments
  const stops: RoutePoint[] = [];
  const segments: RouteSegment[] = [];
  const polyline: [number, number][] = [];

  for (let i = 0; i < fullPath.length; i++) {
    const nodeId = fullPath[i];
    const node = nodes.get(nodeId);

    if (!node) continue;

    const routePoint: RoutePoint = {
      x: node.x,
      y: node.y,
      name: node.name,
      poiId: nodeId.startsWith('poi:') ? nodeId.substring(4) : undefined,
      type: nodeId.startsWith('poi:') ? 'poi' : 'corridor',
    };

    stops.push(routePoint);
    polyline.push([node.x, node.y]);

    if (i < fullPath.length - 1) {
      const nextNode = nodes.get(fullPath[i + 1]);
      if (nextNode) {
        const segmentDistance = euclideanDistance(node.x, node.y, nextNode.x, nextNode.y);
        segments.push({
          from: routePoint,
          to: {
            x: nextNode.x,
            y: nextNode.y,
            name: nextNode.name,
            poiId: fullPath[i + 1].startsWith('poi:') ? fullPath[i + 1].substring(4) : undefined,
            type: fullPath[i + 1].startsWith('poi:') ? 'poi' : 'corridor',
          },
          distance: segmentDistance,
          polyline: [[node.x, node.y], [nextNode.x, nextNode.y]],
        });
      }
    }
  }

  return {
    totalDistance: totalCost,
    stops,
    segments,
    polyline,
    preferences: {
      visited: visitedPOIs.map((p) => p.id),
      skipped: skippedPOIs,
    },
  };
}
