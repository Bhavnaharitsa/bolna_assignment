import { FlowData, ValidationError } from '../types';

export function validateFlow(flowData: FlowData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if start node exists
  if (!flowData.start_node_id) {
    errors.push({
      field: 'start_node_id',
      message: 'Start node must be specified',
    });
  } else {
    const startNode = flowData.nodes.find((n) => n.id === flowData.start_node_id);
    if (!startNode) {
      errors.push({
        field: 'start_node_id',
        message: `Start node "${flowData.start_node_id}" does not exist`,
      });
    }
  }

  // Check for unique node IDs
  const nodeIds = flowData.nodes.map((n) => n.id);
  const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
  duplicateIds.forEach((id) => {
    errors.push({
      field: `node_${id}`,
      message: `Duplicate node ID: "${id}"`,
    });
  });

  // Validate each node
  flowData.nodes.forEach((node) => {
    // Check required fields
    if (!node.id || node.id.trim() === '') {
      errors.push({
        field: `node_${node.id}_id`,
        message: `Node ID is required`,
      });
    }

    if (!node.description || node.description.trim() === '') {
      errors.push({
        field: `node_${node.id}_description`,
        message: `Description is required for node "${node.id}"`,
      });
    }

    if (!node.prompt || node.prompt.trim() === '') {
      errors.push({
        field: `node_${node.id}_prompt`,
        message: `Prompt is required for node "${node.id}"`,
      });
    }

    // Validate edges
    node.edges.forEach((edge, index) => {
      if (!edge.condition || edge.condition.trim() === '') {
        errors.push({
          field: `node_${node.id}_edge_${index}_condition`,
          message: `Condition is required for edge from "${node.id}"`,
        });
      }

      const targetNode = flowData.nodes.find((n) => n.id === edge.to_node_id);
      if (!targetNode) {
        errors.push({
          field: `node_${node.id}_edge_${index}_target`,
          message: `Target node "${edge.to_node_id}" does not exist`,
        });
      }
    });
  });

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>();
  if (flowData.start_node_id) {
    connectedNodeIds.add(flowData.start_node_id);
  }
  flowData.nodes.forEach((node) => {
    node.edges.forEach((edge) => {
      connectedNodeIds.add(edge.to_node_id);
    });
  });
  flowData.nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id) && node.id !== flowData.start_node_id) {
      errors.push({
        field: `node_${node.id}_disconnected`,
        message: `Node "${node.id}" is disconnected from the flow`,
      });
    }
  });

  return errors;
}
