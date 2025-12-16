/**
 * WebSocket Sync Manager for BPMN diagrams
 * Uses Yjs for conflict-free synchronization without y-websocket
 */

import * as Y from 'yjs';
import Modeler from 'bpmn-js/lib/Modeler';
import { 
  exportDiagramXML, 
  importDiagramXML, 
  subscribeToElementDragEvents, 
  highlightElement, 
  removeElementHighlight,
  subscribeToElementSelectionEvents,
  highlightSelectedElement,
  removeSelectedElementHighlight
} from './modelerService';
import { saveDiagramToStorage } from './diagramService';

const GLOBAL_ROOM = 'bpmn-global-room';

export class WebSocketSyncManager {
  private websocket: WebSocket | null = null;
  private ydoc: Y.Doc | null = null;
  private yText: Y.Text | null = null;
  private modeler: Modeler | null = null;
  private isLocalChange = false;
  private reconnectTimeout: number | null = null;
  private syncDebounceTimeout: number | null = null;
  private synced = false;
  private userId: string;
  private highlightedElements: Set<string> = new Set();
  private selectedElements: Set<string> = new Set();

  constructor(
    private wsUrl: string,
    private onError?: (e: Event) => void,
    private onUserCountUpdate?: (count: number) => void,
    private onUserListUpdate?: (users: string[]) => void
  ) {
    this.userId = this.generateUserId();
  }

  private generateUserId(): string {
    const stored = localStorage.getItem('user_id');
    if (stored) return stored;
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_id', userId);
    return userId;
  }

  private sendUserIdentification(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'user-identify',
        userId: this.userId
      }));
      console.log('User identification sent:', this.userId);
    }
  }

  public async initialize(modeler: Modeler): Promise<void> {
    this.modeler = modeler;
    this.ydoc = new Y.Doc();
    this.yText = this.ydoc.getText('bpmn-xml');

    // Initialize Yjs content with current diagram
    const currentXml = await exportDiagramXML(modeler);
    if (currentXml) {
      this.isLocalChange = true;
      this.yText.insert(0, currentXml);
      this.isLocalChange = false;
    }

    // Create native WebSocket connection
    this.websocket = new WebSocket(this.wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket connected to:', this.wsUrl);
      this.synced = true;
      
      // Send user identification first to receive latest diagram
      this.sendUserIdentification();
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle initial diagram from backend when joining
        if (data.type === 'initial-diagram' && data.xml) {
          console.log('Received initial diagram from backend');
          this.handleRemoteUpdate(data.xml);
        }
        // Handle diagram updates from other clients
        else if (data.type === 'diagram-update' && data.xml) {
          this.handleRemoteUpdate(data.xml);
        }
        // Handle element drag events from other users
        else if (data.type === 'element-drag-start') {
          this.handleRemoteDragStart(data);
        }
        else if (data.type === 'element-drag-end') {
          this.handleRemoteDragEnd(data);
        }
        // Handle element selection events from other users
        else if (data.type === 'element-select') {
          this.handleRemoteElementSelect(data);
        }
        else if (data.type === 'element-unselect') {
          this.handleRemoteElementUnselect(data);
        }
        // Handle user count updates
        else if (data.type === 'user-count-update' && data.count !== undefined) {
          console.log('Online users:', data.count);
          if (this.onUserCountUpdate) {
            this.onUserCountUpdate(data.count);
          }
          if (this.onUserListUpdate && data.users) {
            this.onUserListUpdate(data.users);
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.synced = false;
      this.onError?.(error);
    };

    this.websocket.onclose = () => {
      console.warn('WebSocket connection closed');
      this.synced = false;
      this.attemptReconnect();
    };

    // Observe Yjs changes
    this.yText.observe((event) => {
      if (!this.isLocalChange) {
        console.log('Yjs change detected');
      }
    });

    // Subscribe to modeler changes
    modeler.on('commandStack.changed', async () => {
      await this.handleLocalChange();
    });

    // Subscribe to element drag events
    subscribeToElementDragEvents(
      modeler,
      (element) => this.handleLocalDragStart(element),
      (element) => this.handleLocalDragEnd(element)
    );

    // Subscribe to element selection events
    subscribeToElementSelectionEvents(
      modeler,
      (element) => this.handleLocalElementSelect(element),
      (element) => this.handleLocalElementUnselect(element)
    );

    console.log('WebSocketSyncManager initialized');
  }

  private handleLocalDragStart(element: any): void {
    if (!element || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    // Don't highlight locally - only broadcast to other users
    // Broadcast drag start event to other users
    this.websocket.send(JSON.stringify({
      type: 'element-drag-start',
      elementId: element.id,
      elementType: element.type,
      userId: this.userId,
      timestamp: Date.now()
    }));

    console.log('Broadcast element drag start:', element.id);
  }

  private handleLocalDragEnd(element: any): void {
    if (!element || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    // Broadcast drag end event to other users
    this.websocket.send(JSON.stringify({
      type: 'element-drag-end',
      elementId: element.id,
      elementType: element.type,
      userId: this.userId,
      x: element.x,
      y: element.y,
      timestamp: Date.now()
    }));

    console.log('Broadcast element drag end:', element.id);
  }

  private handleRemoteDragStart(data: any): void {
    if (!this.modeler || data.userId === this.userId) return;

    console.log('Remote drag start received:', data.elementId, 'from user:', data.userId);
    
    // Highlight element being dragged by remote user
    highlightElement(this.modeler, data.elementId);
    this.highlightedElements.add(data.elementId);
  }

  private handleRemoteDragEnd(data: any): void {
    if (!this.modeler || data.userId === this.userId) return;

    console.log('Remote drag end received:', data.elementId, 'from user:', data.userId);
    
    // Remove highlight from remotely dragged element
    removeElementHighlight(this.modeler, data.elementId);
    this.highlightedElements.delete(data.elementId);
  }

  private handleLocalElementSelect(element: any): void {
    if (!element || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    // Don't highlight locally - only broadcast to other users
    // Broadcast element select event to other users
    this.websocket.send(JSON.stringify({
      type: 'element-select',
      elementId: element.id,
      elementType: element.type,
      userId: this.userId,
      timestamp: Date.now()
    }));

    console.log('Broadcast element select:', element.id);
  }

  private handleLocalElementUnselect(element: any): void {
    if (!element || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    // Broadcast element unselect event to other users
    this.websocket.send(JSON.stringify({
      type: 'element-unselect',
      elementId: element.id,
      elementType: element.type,
      userId: this.userId,
      timestamp: Date.now()
    }));

    console.log('Broadcast element unselect:', element.id);
  }

  private handleRemoteElementSelect(data: any): void {
    if (!this.modeler || data.userId === this.userId) return;

    console.log('Remote element select received:', data.elementId, 'from user:', data.userId);
    
    // Highlight element selected by remote user with blue color
    highlightSelectedElement(this.modeler, data.elementId);
    this.selectedElements.add(data.elementId);
  }

  private handleRemoteElementUnselect(data: any): void {
    if (!this.modeler || data.userId === this.userId) return;

    console.log('Remote element unselect received:', data.elementId, 'from user:', data.userId);
    
    // Remove highlight from remotely unselected element
    removeSelectedElementHighlight(this.modeler, data.elementId);
    this.selectedElements.delete(data.elementId);
  }

  private async handleLocalChange(): Promise<void> {
    if (!this.modeler || !this.yText) return;

    try {
      const xml = await exportDiagramXML(this.modeler);
      if (xml) {
        this.isLocalChange = true;
        
        // Update Yjs document
        this.yText.delete(0, this.yText.length);
        this.yText.insert(0, xml);
        
        this.isLocalChange = false;

        // Send update via WebSocket
        this.sendUpdate(xml);

        // Debounced save to localStorage
        this.debouncedSaveToLocalStorage(xml);
      }
    } catch (err) {
      console.error('Error handling local change:', err);
    }
  }

  private sendUpdate(xml?: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      const xmlToSend = xml || this.yText?.toString() || '';
      this.websocket.send(JSON.stringify({
        type: 'diagram-update',
        xml: xmlToSend,
        room: GLOBAL_ROOM,
        timestamp: Date.now()
      }));
    }
  }

  private handleRemoteUpdate(xml: string): void {
    if (!this.modeler || this.isLocalChange) return;

    try {
      // Update Yjs document
      this.isLocalChange = true;
      if (this.yText) {
        this.yText.delete(0, this.yText.length);
        this.yText.insert(0, xml);
      }
      this.isLocalChange = false;

      // Apply to modeler
      this.applyRemoteChanges(xml);
    } catch (err) {
      console.error('Error handling remote update:', err);
    }
  }

  private async applyRemoteChanges(xml?: string): Promise<void> {
    if (!this.modeler) return;

    try {
      const xmlToApply = xml || this.yText?.toString() || '';
      if (xmlToApply && xmlToApply.trim()) {
        this.isLocalChange = true;
        await importDiagramXML(this.modeler, xmlToApply);
        this.isLocalChange = false;
        
        // Save to localStorage
        this.debouncedSaveToLocalStorage(xmlToApply);
        console.log('Remote changes applied');
      }
    } catch (err) {
      console.error('Error applying remote changes:', err);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      if (this.modeler) {
        this.initialize(this.modeler).catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
      this.reconnectTimeout = null;
    }, 5000);
  }

  private debouncedSaveToLocalStorage(xml: string): void {
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }

    this.syncDebounceTimeout = setTimeout(() => {
      saveDiagramToStorage(xml);
      console.log('Diagram saved to localStorage');
    }, 1000);
  }

  public isSynced(): boolean {
    return this.synced && this.websocket?.readyState === WebSocket.OPEN;
  }

  public cleanup(): void {
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.websocket) {
      this.websocket.close();
    }

    if (this.ydoc) {
      this.ydoc.destroy();
    }

    this.websocket = null;
    this.ydoc = null;
    this.yText = null;
    this.modeler = null;
  }
}
