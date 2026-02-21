import { useState, useEffect } from 'react';
import { FlowData, ValidationError } from '../types';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';

interface JSONPreviewProps {
  flowData: FlowData;
  validationErrors: ValidationError[];
  onImport: (data: FlowData) => void;
}

export default function JSONPreview({
  flowData,
  validationErrors,
  onImport,
}: JSONPreviewProps) {
  const [jsonString, setJsonString] = useState('');
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    const json = JSON.stringify(flowData, null, 2);
    setJsonString(json);
    const html = Prism.highlight(json, Prism.languages.json, 'json');
    setHighlightedHtml(html);
  }, [flowData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    alert('JSON copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      onImport(parsed);
      setShowImport(false);
      setImportText('');
    } catch (error) {
      alert('Invalid JSON: ' + (error as Error).message);
    }
  };

  const hasErrors = validationErrors.length > 0;

  return (
    <div className="json-panel-content" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="json-panel-header">
        <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '12px' }}>
          JSON Preview
        </h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            className="btn-secondary"
            onClick={handleCopy}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Copy
          </button>
          <button
            className="btn-secondary"
            onClick={handleDownload}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Download
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowImport(!showImport)}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {showImport ? 'Cancel' : 'Import'}
          </button>
        </div>
      </div>

      {showImport && (
        <div style={{ padding: '12px', background: '#2d2d2d', marginBottom: '12px' }}>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste JSON here..."
            style={{
              width: '100%',
              minHeight: '150px',
              background: '#1e1e1e',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
          <button
            className="btn-primary"
            onClick={handleImport}
            style={{
              marginTop: '8px',
              width: '100%',
              fontSize: '12px',
              padding: '6px 12px',
            }}
          >
            Import JSON
          </button>
        </div>
      )}

      {hasErrors && (
        <div
          style={{
            background: '#7f1d1d',
            border: '1px solid #991b1b',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ color: '#fecaca', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
            Validation Errors ({validationErrors.length})
          </div>
          <ul style={{ color: '#fecaca', fontSize: '12px', listStyle: 'none', padding: 0 }}>
            {validationErrors.map((error, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <pre
        style={{
          margin: 0,
          padding: '16px',
          background: '#1e1e1e',
          color: '#d4d4d4',
          fontSize: '12px',
          lineHeight: '1.5',
          overflow: 'auto',
          flex: 1,
        }}
      >
        <code
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          style={{ fontFamily: 'Monaco, Consolas, monospace' }}
        />
      </pre>
    </div>
  );
}
