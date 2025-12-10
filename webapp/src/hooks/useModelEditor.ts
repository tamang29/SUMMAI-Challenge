/**
 * Custom Hook - useModelEditor
 * Responsibility: Manage modeler lifecycle and state
 */

import { useEffect, useRef, useCallback } from 'react';
import Modeler from 'bpmn-js/lib/Modeler';
import {
  createModeler,
  importDiagramXML,
  exportDiagramXML,
  fitDiagramToViewport,
  destroyModeler
} from '../services/modelerService';
import {
  loadDiagramFromStorage,
  saveDiagramToStorage
} from '../services/diagramService';
import { SocketService } from '../services/socketService';

interface UseModelEditorReturn {
  modelerRef: any;
  saveXML: () => Promise<string | null>;
}

export const useModelEditor = (
  containerRef: any,
  socketRef: any
): UseModelEditorReturn => {
  const modelerRef = useRef(null) as any;

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

        // Setup auto-save on changes
        modeler.on('commandStack.changed', handleDiagramChange);

        console.log('BPMN modeler initialized successfully');
      } catch (err) {
        console.error('Error initializing modeler:', err);
      }
    };

    initializeModeler();

    // Cleanup on unmount
    return () => {
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
