/**
 * Custom Hook - useModelEditor
 * Responsibility: Manage modeler lifecycle and Yjs sync
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  loadDiagramFromStorage,
  saveDiagramToStorage
} from '../services/diagramService';
import {
  createModeler,
  destroyModeler,
  exportDiagramXML,
  fitDiagramToViewport,
  importDiagramXML
} from '../services/modelerService';
import { WebSocketSyncManager } from '../services/websocketSyncManager';

interface UseModelEditorReturn {
  modelerRef: any;
  saveXML: () => Promise<string | null>;
}

export const useModelEditor = (
  containerRef: any,
  socketRef: any
): UseModelEditorReturn => {
  const modelerRef = useRef(null) as any;
  const syncManagerRef = useRef<WebSocketSyncManager | null>(null);

  /**
   * Handle diagram changes - auto-save to localStorage
   */
  const handleDiagramChange = useCallback(async () => {
    if (!modelerRef.current) return;

    const xml = await exportDiagramXML(modelerRef.current);
    if (xml) {
      saveDiagramToStorage(xml);
    }
  }, []);

  useEffect(() => {
    const initializeModeler = async () => {
      if (!containerRef.current || modelerRef.current) return;

      try {
        const modeler = createModeler(containerRef.current);
        modelerRef.current = modeler;

        // Load diagram from storage
        const diagramXML = loadDiagramFromStorage();
        await importDiagramXML(modeler, diagramXML);

        // Fit to viewport
        fitDiagramToViewport(modeler);

        // Initialize Yjs WebSocket sync manager
        try {
          const syncManager = new WebSocketSyncManager(
            'ws://localhost:8000',
            (error: Event) => {
              console.error('WebSocket sync error:', error);
            }
          );
          
          await syncManager.initialize(modeler);
          syncManagerRef.current = syncManager;

        } catch (err) {
          console.error('Failed to initialize Yjs sync:', err);
          // Fallback to localStorage only
          modeler.on('commandStack.changed', handleDiagramChange);
        }

        console.log('BPMN modeler initialized successfully');
      } catch (err) {
        console.error('Error initializing modeler:', err);
      }
    };

    initializeModeler();

    // Cleanup on unmount
    return () => {
      if (syncManagerRef.current) {
        syncManagerRef.current.cleanup();
        syncManagerRef.current = null;
      }

      if (modelerRef.current) {
        destroyModeler(modelerRef.current);
        modelerRef.current = null;
      }
    };
  }, [handleDiagramChange]);

  const saveXML = useCallback(async () => {
    if (!modelerRef.current) return null;
    return await exportDiagramXML(modelerRef.current);
  }, []);

  return {
    modelerRef,
    saveXML
  };
};
