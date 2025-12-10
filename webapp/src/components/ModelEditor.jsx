import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Modeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

const diagramXML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"><process id="Process_1"/><bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1"/></bpmndi:BPMNDiagram></definitions>`;

const ModelEditor = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  // Expose saveXML method via ref
  useImperativeHandle(ref, () => ({
    async saveXML() {
      if (modelerRef.current) {
        try {
          const { xml } = await modelerRef.current.saveXML({ format: true });
          return xml;
        } catch (err) {
          console.error('Error saving XML:', err);
          return null;
        }
      }
      return null;
    }
  }));

  useEffect(() => {
    const initializeModeler = async () => {
      if (containerRef.current && !modelerRef.current) {
        const modeler = new Modeler({
          container: containerRef.current
        });
        modelerRef.current = modeler;

        try {
          // Load from localStorage if exists, otherwise use default
          const savedXML = localStorage.getItem('bpmn-diagram');
          const xmlToLoad = savedXML || diagramXML;
          
          const { warnings } = await modeler.importXML(xmlToLoad);

          if (warnings.length > 0) {
            console.log('warnings', warnings);
          }

          modeler.get('canvas').zoom('fit-viewport');
          console.log('BPMN modeler initialized');

          // Save to localStorage on every change
          modeler.on('commandStack.changed', async () => {
            try {
              const { xml } = await modeler.saveXML({ format: true });
              localStorage.setItem('bpmn-diagram', xml);
              console.log('Diagram saved to localStorage');
            } catch (err) {
              console.error('Error saving to localStorage:', err);
            }
          });
        } catch (err) {
          console.error('error initializing modeler', err);
        }
      }
    };

    initializeModeler();

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="bpmn-container"></div>;
});

ModelEditor.displayName = 'ModelEditor';

export default ModelEditor;
