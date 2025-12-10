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
