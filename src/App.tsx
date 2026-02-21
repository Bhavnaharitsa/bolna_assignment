import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge as ReactFlowEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import NodeSidebar from './components/NodeSidebar';
import JSONPreview from './components/JSONPreview';
import { FlowData, Node as FlowNode, ValidationError } from './types';
import { validateFlow } from './utils/validation';
import { flowToReactFlow, reactFlowToFlow } from './utils/flowConverter';

const initialNodes: Node[] = [];
const initialEdges: ReactFlowEdge[] = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              label: 'Click to edit condition',
            },
            eds
          )
        );
      }
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: ReactFlowEdge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const addNode = useCallback(() => {
    const newNodeId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'default',
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: newNodeId,
        description: '',
        prompt: '',
        edges: [],
      },
    };
    setNodes((nds) => [...nds, newNode]);
    if (!startNodeId) {
      setStartNodeId(newNodeId);
    }
  }, [setNodes, startNodeId]);

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (startNodeId === nodeId) {
        const remainingNodes = nodes.filter((n) => n.id !== nodeId);
        setStartNodeId(remainingNodes.length > 0 ? remainingNodes[0].id : null);
      }
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [setNodes, setEdges, nodes, startNodeId, selectedNodeId]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<FlowNode>) => {
      const oldId = nodeId;
      const newId = updates.id;
      
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === oldId) {
            return {
              ...node,
              id: newId || node.id,
              data: {
                ...node.data,
                ...updates,
                label: newId || node.data.label,
              },
            };
          }
          return node;
        })
      );

      // Update edges if node ID changed
      if (newId && newId !== oldId) {
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === oldId) {
              return { ...edge, source: newId };
            }
            if (edge.target === oldId) {
              return { ...edge, target: newId };
            }
            return edge;
          })
        );
        
        // Update start node ID if it changed
        if (startNodeId === oldId) {
          setStartNodeId(newId);
        }
        
        // Update selected node ID if it changed
        if (selectedNodeId === oldId) {
          setSelectedNodeId(newId);
        }
      }
    },
    [setNodes, setEdges, startNodeId, selectedNodeId]
  );

  const addEdgeFromSidebar = useCallback(
    (sourceNodeId: string, targetNodeId: string) => {
      const newEdge: ReactFlowEdge = {
        id: `edge_${sourceNodeId}_${targetNodeId}_${Date.now()}`,
        source: sourceNodeId,
        target: targetNodeId,
        type: 'smoothstep',
        animated: true,
        label: 'Click to edit condition',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          condition: '',
          parameters: {},
        },
      };
      setEdges((eds) => [...eds, newEdge]);
    },
    [setEdges]
  );

  const updateEdge = useCallback(
    (edgeId: string, condition: string, parameters?: Record<string, string>, targetNodeId?: string) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              target: targetNodeId || edge.target,
              label: condition || 'Click to edit condition',
              data: { condition, parameters },
            };
          }
          return edge;
        })
      );
    },
    [setEdges]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  const flowData: FlowData = useMemo(() => {
    return reactFlowToFlow(nodes, edges, startNodeId);
  }, [nodes, edges, startNodeId]);

  const errors = useMemo(() => {
    return validateFlow(flowData);
  }, [flowData]);

  useMemo(() => {
    setValidationErrors(errors);
  }, [errors]);

  const handleImportJSON = useCallback((json: FlowData) => {
    const { reactFlowNodes, reactFlowEdges, startId } = flowToReactFlow(json);
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
    setStartNodeId(startId);
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
          setSelectedEdgeId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, deleteNode, deleteEdge]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="app">
      <div className="toolbar">
        <button onClick={addNode} className="btn-primary">
          + Add Node
        </button>
        <div className="toolbar-info">
          {startNodeId && (
            <span className="start-node-indicator">
              Start: <strong>{startNodeId}</strong>
            </span>
          )}
        </div>
      </div>
      <div className="main-content">
        <div className="canvas-container">
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              style: {
                ...node.style,
                border: startNodeId === node.id ? '3px solid #10b981' : undefined,
                borderColor: startNodeId === node.id ? '#10b981' : undefined,
              },
            }))}
            edges={edges.map((edge) => ({
              ...edge,
              style: {
                ...edge.style,
                stroke: selectedEdgeId === edge.id ? '#3b82f6' : undefined,
                strokeWidth: selectedEdgeId === edge.id ? 3 : undefined,
              },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <div className="sidebar">
          {selectedNode ? (
            <NodeSidebar
              node={selectedNode}
              allNodes={nodes}
              edges={edges}
              isStartNode={selectedNode.id === startNodeId}
              onSetStartNode={() => setStartNodeId(selectedNode.id)}
              onUpdateNode={updateNode}
              onAddEdge={addEdgeFromSidebar}
              onUpdateEdge={updateEdge}
              onDeleteEdge={deleteEdge}
              onDeleteNode={deleteNode}
              validationErrors={validationErrors.filter((e) =>
                e.field.includes(selectedNode.id)
              )}
            />
          ) : (
            <div className="sidebar-placeholder">
              <p>Select a node to edit its properties</p>
            </div>
          )}
        </div>
        <div className="json-panel">
          <JSONPreview
            flowData={flowData}
            validationErrors={validationErrors}
            onImport={handleImportJSON}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
