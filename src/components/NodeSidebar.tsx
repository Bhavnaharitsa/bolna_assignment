import { useState, useEffect } from 'react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';
import { Edge, ValidationError } from '../types';

interface NodeSidebarProps {
  node: ReactFlowNode;
  allNodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  isStartNode: boolean;
  onSetStartNode: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<{ id: string; description: string; prompt: string; edges: Edge[] }>) => void;
  onAddEdge: (sourceNodeId: string, targetNodeId: string) => void;
  onUpdateEdge: (edgeId: string, condition: string, parameters?: Record<string, string>, targetNodeId?: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  validationErrors: ValidationError[];
}

export default function NodeSidebar({
  node,
  allNodes,
  edges,
  isStartNode,
  onSetStartNode,
  onUpdateNode,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  onDeleteNode,
  validationErrors,
}: NodeSidebarProps) {
  const [nodeId, setNodeId] = useState(node.id);
  const [description, setDescription] = useState(node.data.description || '');
  const [prompt, setPrompt] = useState(node.data.prompt || '');

  useEffect(() => {
    setNodeId(node.id);
    setDescription(node.data.description || '');
    setPrompt(node.data.prompt || '');
  }, [node.id, node.data.description, node.data.prompt]);

  const nodeEdges = edges.filter((e) => e.source === node.id);

  const handleNodeIdChange = (newId: string) => {
    setNodeId(newId);
    if (newId !== node.id && newId.trim() !== '') {
      onUpdateNode(node.id, { id: newId });
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    onUpdateNode(node.id, { description: newDescription });
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    onUpdateNode(node.id, { prompt: newPrompt });
  };

  const handleAddEdge = () => {
    const availableTargets = allNodes.filter((n) => n.id !== node.id);
    if (availableTargets.length === 0) return;

    const targetId = availableTargets[0].id;
    onAddEdge(node.id, targetId);
  };

  const getError = (field: string) => {
    return validationErrors.find((e) => e.field.includes(field))?.message;
  };

  return (
    <div className="sidebar-content">
      <div className="section">
        <div className="section-title">Node Properties</div>
        
        <div className="form-group">
          <label>Node ID</label>
          <input
            type="text"
            value={nodeId}
            onChange={(e) => handleNodeIdChange(e.target.value)}
            placeholder="Enter unique node ID"
          />
          {getError('_id') && (
            <div className="error-message">{getError('_id')}</div>
          )}
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Enter node description"
          />
          {getError('_description') && (
            <div className="error-message">{getError('_description')}</div>
          )}
        </div>

        <div className="form-group">
          <label>Prompt *</label>
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Enter node prompt"
          />
          {getError('_prompt') && (
            <div className="error-message">{getError('_prompt')}</div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isStartNode}
              onChange={onSetStartNode}
            />
            Set as Start Node
          </label>
        </div>

        <button
          className="btn-danger"
          onClick={() => onDeleteNode(node.id)}
          style={{ width: '100%', marginTop: '12px' }}
        >
          Delete Node
        </button>
      </div>

      <div className="section">
        <div className="section-title">Outgoing Edges</div>
        
        {nodeEdges.map((edge) => (
          <EdgeEditor
            key={edge.id}
            edge={edge}
            allNodes={allNodes}
            sourceNodeId={node.id}
            onUpdate={onUpdateEdge}
            onDelete={onDeleteEdge}
            validationErrors={validationErrors}
          />
        ))}

        <button
          className="add-edge-btn"
          onClick={handleAddEdge}
          disabled={allNodes.filter((n) => n.id !== node.id).length === 0}
        >
          + Add Edge
        </button>
      </div>
    </div>
  );
}

interface EdgeEditorProps {
  edge: ReactFlowEdge;
  allNodes: ReactFlowNode[];
  sourceNodeId: string;
  onUpdate: (edgeId: string, condition: string, parameters?: Record<string, string>, targetNodeId?: string) => void;
  onDelete: (edgeId: string) => void;
  validationErrors: ValidationError[];
}

function EdgeEditor({
  edge,
  allNodes,
  sourceNodeId,
  onUpdate,
  onDelete,
  validationErrors,
}: EdgeEditorProps) {
  const [condition, setCondition] = useState(edge.data?.condition || edge.label || '');
  const [targetNodeId, setTargetNodeId] = useState(edge.target);
  const [showParameters, setShowParameters] = useState(false);
  const [parameters, setParameters] = useState<Record<string, string>>(
    edge.data?.parameters || {}
  );

  useEffect(() => {
    setCondition(edge.data?.condition || edge.label || '');
    setTargetNodeId(edge.target);
    setParameters(edge.data?.parameters || {});
  }, [edge.id, edge.data, edge.label, edge.target]);

  const handleConditionChange = (newCondition: string) => {
    setCondition(newCondition);
    onUpdate(edge.id, newCondition, parameters);
  };

  const handleTargetChange = (newTarget: string) => {
    setTargetNodeId(newTarget);
    onUpdate(edge.id, condition, parameters, newTarget);
  };

  const handleParameterChange = (key: string, value: string) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    onUpdate(edge.id, condition, newParams);
  };

  const handleRemoveParameter = (key: string) => {
    const newParams = { ...parameters };
    delete newParams[key];
    setParameters(newParams);
    onUpdate(edge.id, condition, newParams);
  };

  const availableTargets = allNodes.filter((n) => n.id !== sourceNodeId);

  const getError = (field: string) => {
    return validationErrors.find((e) => e.field.includes(field))?.message;
  };

  return (
    <div className="edge-item">
      <div className="edge-item-header">
        <span className="edge-item-title">To: {targetNodeId}</span>
        <button
          className="btn-small btn-small-danger"
          onClick={() => onDelete(edge.id)}
        >
          Delete
        </button>
      </div>

      <div className="form-group">
        <label>Target Node</label>
        <select
          value={targetNodeId}
          onChange={(e) => handleTargetChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          {availableTargets.map((n) => (
            <option key={n.id} value={n.id}>
              {n.id}
            </option>
          ))}
        </select>
        {getError('_target') && (
          <div className="error-message">{getError('_target')}</div>
        )}
      </div>

      <div className="form-group">
        <label>Condition *</label>
        <input
          type="text"
          value={condition}
          onChange={(e) => handleConditionChange(e.target.value)}
          placeholder="Enter transition condition"
        />
        {getError('_condition') && (
          <div className="error-message">{getError('_condition')}</div>
        )}
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={showParameters}
            onChange={(e) => setShowParameters(e.target.checked)}
          />
          Show Parameters
        </label>
        {showParameters && (
          <div style={{ marginTop: '8px' }}>
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={key}
                  placeholder="Key"
                  readOnly
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleParameterChange(key, e.target.value)}
                  placeholder="Value"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-small btn-small-danger"
                  onClick={() => handleRemoveParameter(key)}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="btn-small"
              onClick={() => {
                const newKey = `param_${Date.now()}`;
                handleParameterChange(newKey, '');
              }}
              style={{
                background: '#e5e7eb',
                color: '#374151',
                width: '100%',
              }}
            >
              + Add Parameter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
