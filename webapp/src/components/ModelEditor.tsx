import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
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
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const { saveXML } = useModelEditor(containerRef, socketRef);

  const [openConnectedUsersList, setOpenConnectedUsersList] = useState(false);

  // Initialize socket connection on mount
  useEffect(() => {
    if (!socketRef.current) {
      const socketUrl = 'ws://localhost:8000';
      socketRef.current = new SocketService(socketUrl);
      
      // Set up connected users callback
      socketRef.current.setOnConnectedUsersUpdate((users: string[]) => {
        setConnectedUsers(users);
      });
      
      socketRef.current.connect().catch(err => console.error('Socket connection failed:', err));
    }
  }, []);

  // Expose saveXML method via ref
  useImperativeHandle(ref, () => ({
    saveXML
  }));

  const toggleConnectedUsersList = () => {
    setOpenConnectedUsersList(!openConnectedUsersList);
  }

  return (
    <>
      <div className="connected-users-list">
        <button onClick={toggleConnectedUsersList}> 
          Connected Users: ({connectedUsers.length})
        </button>
        {(openConnectedUsersList && connectedUsers.length > 0) ? (
          <ul>
            {connectedUsers.map((user) => (
              <li key={user}>
                <span className="user-indicator">●</span>
                {user}
              </li>
            ))}
          </ul>
        ): null}
      </div>
      <div ref={containerRef} className="bpmn-container" />
    </>
  );
});

ModelEditor.displayName = 'ModelEditor';

export default ModelEditor;
