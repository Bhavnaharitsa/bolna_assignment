import { Node as ReactFlowNode, Edge as ReactFlowEdge, MarkerType } from 'reactflow';
import { FlowData, Node as FlowNode, Edge } from '../types';

export function reactFlowToFlow(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  startNodeId: string | null
): FlowData {
  const flowNodes: FlowNode[] = nodes.map((node) => {
    const nodeEdges: Edge[] = edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => ({
        to_node_id: edge.target,
        condition: edge.data?.condition || (edge.label as string) || '',
        parameters: edge.data?.parameters,
      }));

    return {
      id: node.id,
      description: node.data.description || '',
      prompt: node.data.prompt || '',
      edges: nodeEdges,
    };
  });

  return {
    start_node_id: startNodeId || '',
    nodes: flowNodes,
  };
}

export function flowToReactFlow(flowData: FlowData): {
  reactFlowNodes: ReactFlowNode[];
  reactFlowEdges: ReactFlowEdge[];
  startId: string | null;
} {
  const reactFlowNodes: ReactFlowNode[] = flowData.nodes.map((node, index) => ({
    id: node.id,
    type: 'default',
    position: {
      x: (index % 3) * 250,
      y: Math.floor(index / 3) * 200,
    },
    data: {
      label: node.id,
      description: node.description || '',
      prompt: node.prompt || '',
      edges: node.edges,
    },
  }));

  const reactFlowEdges: ReactFlowEdge[] = [];
  flowData.nodes.forEach((node) => {
    node.edges.forEach((edge, edgeIndex) => {
      reactFlowEdges.push({
        id: `edge_${node.id}_${edge.to_node_id}_${edgeIndex}`,
        source: node.id,
        target: edge.to_node_id,
        type: 'smoothstep',
        animated: true,
        label: edge.condition || 'Click to edit condition',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          condition: edge.condition,
          parameters: edge.parameters,
        },
      });
    });
  });

  return {
    reactFlowNodes,
    reactFlowEdges,
    startId: flowData.start_node_id || null,
  };
}
