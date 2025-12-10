import { useRef, useImperativeHandle, forwardRef } from 'react';
import { useModelEditor } from '../hooks/useModelEditor';
import { SocketService } from '../services/socketService';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

export interface ModelEditorRef {
  saveXML: () => Promise<string | null>;
}

const ModelEditor = forwardRef<ModelEditorRef>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<SocketService | null>(null);
  const { saveXML } = useModelEditor(containerRef, socketRef);

  // Initialize socket connection on mount
  if (!socketRef.current) {
    const socketUrl = 'ws://localhost:8000';
    socketRef.current = new SocketService(socketUrl);
    socketRef.current.connect().catch(err => console.error('Socket connection failed:', err));
  }

  // Expose saveXML method via ref
  useImperativeHandle(ref, () => ({
    saveXML
  }));

  return <div ref={containerRef} className="bpmn-container" />;
});

ModelEditor.displayName = 'ModelEditor';

export default ModelEditor;
