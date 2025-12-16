import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { useModelEditor } from '../hooks/useModelEditor';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

export interface ModelEditorRef {
  saveXML: () => Promise<string | null>;
}

const ModelEditor = forwardRef<ModelEditorRef>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(0);
  const [onlineUsersList, setOnlineUsersList] = useState<string[]>([]);
  const [showUsersList, setShowUsersList] = useState<boolean>(false);
  const { saveXML } = useModelEditor(containerRef, setOnlineUsersCount, setOnlineUsersList);

  // Expose saveXML method via ref
  useImperativeHandle(ref, () => ({
    saveXML
  }));

  return (
    <div className="model-editor-container">
      <div className="editor-header">
        <div className="header-controls">
          <div className="connected-users-list">
            <button onClick={() => setShowUsersList(!showUsersList)}> 
              Online Users: ({onlineUsersCount})
            </button>
            {showUsersList && onlineUsersList.length > 0 && (
              <ul>
                {onlineUsersList.map((user) => (
                  <li key={user}>
                    <span className="user-indicator">●</span>
                    {user}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="activity-indicator">
            <div className="activity-title">User Activity</div>
            <div className="legend-item">
              <span className="marker marker-blue"></span>
              <span>Element Selected</span>
            </div>
            <div className="legend-item">
              <span className="marker marker-green"></span>
              <span>Element Dragging</span>
            </div>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="bpmn-container" />
    </div>
  );
});

ModelEditor.displayName = 'ModelEditor';

export default ModelEditor;
