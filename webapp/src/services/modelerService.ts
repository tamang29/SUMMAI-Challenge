/**
 * Modeler Service - Handles BPMN modeler operations
 * Responsibility: Initialize, manage, and configure the BPMN modeler
 */

import Modeler from 'bpmn-js/lib/Modeler';

export const createModeler = (container: HTMLElement): Modeler => {
  return new Modeler({
    container
  });
};

/**
 * Subscribe to element drag events
 * bpmn-js provides the following drag events:
 * - 'element.changed' - fired when element properties change
 * - 'shape.added', 'shape.removed' - connection/shape lifecycle
 */
export const subscribeToElementDragEvents = (
  modeler: Modeler,
  onDragStart: (element: any) => void,
  onDragEnd: (element: any) => void
): void => {
  try {
    const eventBus = modeler.get('eventBus') as any;
    
    // Listen for shape.move.start - when user starts dragging an element
    eventBus.on('shape.move.start', (event: any) => {
      const { shape } = event;
      console.log('Element drag started:', shape.id, shape);
      onDragStart(shape);
    });

    // Listen for shape.move.end - when user finishes dragging an element
    eventBus.on('shape.move.end', (event: any) => {
      const { shape } = event;
      console.log('Element drag ended:', shape.id, shape);
      onDragEnd(shape);
    });

    // Alternative: Listen for element.changed which fires during drag movements
    eventBus.on('element.changed', (event: any) => {
      const { element } = event;
      if (element && element.x !== undefined && element.y !== undefined) {
        console.log('Element position changed:', element.id);
      }
    });

  } catch (err) {
    console.error('Error subscribing to drag events:', err);
  }
};

/**
 * Highlight element with green color
 */
export const highlightElement = (modeler: Modeler, elementId: string): void => {
  try {
    const canvas = modeler.get('canvas') as any;
    const elementRegistry = modeler.get('elementRegistry') as any;
    
    const element = elementRegistry.get(elementId);
    if (element) {
      // Add green overlay/highlight
      canvas.addMarker(elementId, 'highlight-green');
    }
  } catch (err) {
    console.error('Error highlighting element:', err);
  }
};

/**
 * Remove highlight from element
 */
export const removeElementHighlight = (modeler: Modeler, elementId: string): void => {
  try {
    const canvas = modeler.get('canvas') as any;
    canvas.removeMarker(elementId, 'highlight-green');
  } catch (err) {
    console.error('Error removing element highlight:', err);
  }
};

/**
 * Subscribe to element selection events
 * bpmn-js provides the following selection events:
 * - 'selection.changed' - fired when selection changes
 */
export const subscribeToElementSelectionEvents = (
  modeler: Modeler,
  onElementSelected: (element: any) => void,
  onElementUnselected: (element: any) => void
): void => {
  try {
    const selection = modeler.get('selection') as any;
    const eventBus = modeler.get('eventBus') as any;

    // Listen for selection.changed - fires when user selects/deselects elements
    eventBus.on('selection.changed', (event: any) => {
      const { newSelection, oldSelection } = event;
      
      console.log('Selection changed - New:', newSelection, 'Old:', oldSelection);

      // Handle newly selected elements
      if (newSelection && newSelection.length > 0) {
        newSelection.forEach((element: any) => {
          // Only notify if this is a newly selected element (not in oldSelection)
          const wasSelected = oldSelection && oldSelection.some((el: any) => el.id === element.id);
          if (!wasSelected) {
            console.log('Element selected:', element.id);
            onElementSelected(element);
          }
        });
      }

      // Handle deselected elements
      if (oldSelection && oldSelection.length > 0) {
        oldSelection.forEach((element: any) => {
          // Only notify if this element is no longer selected (not in newSelection)
          const isStillSelected = newSelection && newSelection.some((el: any) => el.id === element.id);
          if (!isStillSelected) {
            console.log('Element unselected:', element.id);
            onElementUnselected(element);
          }
        });
      }
    });

  } catch (err) {
    console.error('Error subscribing to selection events:', err);
  }
};

/**
 * Highlight element with blue color (for selection)
 */
export const highlightSelectedElement = (modeler: Modeler, elementId: string): void => {
  try {
    const canvas = modeler.get('canvas') as any;
    const elementRegistry = modeler.get('elementRegistry') as any;
    
    const element = elementRegistry.get(elementId);
    if (element) {
      // Add blue overlay/highlight for selection
      canvas.addMarker(elementId, 'highlight-blue');
    }
  } catch (err) {
    console.error('Error highlighting selected element:', err);
  }
};

/**
 * Remove selection highlight from element
 */
export const removeSelectedElementHighlight = (modeler: Modeler, elementId: string): void => {
  try {
    const canvas = modeler.get('canvas') as any;
    canvas.removeMarker(elementId, 'highlight-blue');
  } catch (err) {
    console.error('Error removing selected element highlight:', err);
  }
};

interface ImportResult {
  warnings: string[];
}

export const importDiagramXML = async (modeler: Modeler, xml: string): Promise<ImportResult> => {
  try {
    const result = await modeler.importXML(xml);
    
    if (result.warnings.length > 0) {
      console.log('Import warnings:', result.warnings);
    }
    
    return result;
  } catch (err) {
    console.error('Error importing XML:', err);
    throw err;
  }
};

interface ExportResult {
  xml: string;
}

export const exportDiagramXML = async (modeler: Modeler): Promise<string | null> => {
  try {
    const { xml } = await modeler.saveXML({ format: true }) as ExportResult;
    return xml;
  } catch (err) {
    console.error('Error exporting XML:', err);
    return null;
  }
};

export const fitDiagramToViewport = (modeler: Modeler): void => {
  try {
    const canvas = modeler.get('canvas') as any;
    canvas.zoom('fit-viewport');
  } catch (err) {
    console.error('Error fitting diagram to viewport:', err);
  }
};

export const destroyModeler = (modeler: Modeler): void => {
  try {
    if (modeler) {
      modeler.destroy();
    }
  } catch (err) {
    console.error('Error destroying modeler:', err);
  }
};
