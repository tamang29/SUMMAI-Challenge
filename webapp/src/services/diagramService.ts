/**
 * Diagram Service - Handles diagram persistence and retrieval
 * Responsibility: Manage diagram storage and retrieval from localStorage
 */

const DIAGRAM_STORAGE_KEY = 'bpmn-diagram';

const DEFAULT_DIAGRAM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"><process id="Process_1"/><bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1"/></bpmndi:BPMNDiagram></definitions>`;

/**
 * Load diagram from storage or return default
 * @returns {string} BPMN XML
 */
export const loadDiagramFromStorage = (): string => {
  try {
    const savedXML = localStorage.getItem(DIAGRAM_STORAGE_KEY);
    return savedXML || DEFAULT_DIAGRAM_XML;
  } catch (err) {
    console.error('Error loading diagram from storage:', err);
    return DEFAULT_DIAGRAM_XML;
  }
};

/**
 * Save diagram to storage
 * @param {string} xml - BPMN XML to save
 */
export const saveDiagramToStorage = (xml: string): void => {
  try {
    localStorage.setItem(DIAGRAM_STORAGE_KEY, xml);
    console.log('Diagram saved to localStorage');
  } catch (err) {
    console.error('Error saving diagram to storage:', err);
  }
};

/**
 * Clear diagram from storage
 */
export const clearDiagramFromStorage = (): void => {
  try {
    localStorage.removeItem(DIAGRAM_STORAGE_KEY);
    console.log('Diagram cleared from storage');
  } catch (err) {
    console.error('Error clearing diagram from storage:', err);
  }
};
