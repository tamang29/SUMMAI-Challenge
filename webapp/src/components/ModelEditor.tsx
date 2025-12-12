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
    <>
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
      <div ref={containerRef} className="bpmn-container" />
    </>
  );
});

ModelEditor.displayName = 'ModelEditor';

export default ModelEditor;
