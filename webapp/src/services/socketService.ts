/**
 * WebSocket Socket Service
 * Responsibility: Handle WebSocket client connections
 */

/**
 * Create and manage WebSocket connection
 */
export class SocketService {
  url: string;
  socket: WebSocket | null;
  isConnected: boolean;
  userId: string;
  onConnectedUsersUpdate: ((users: string[]) => void) | null;

  constructor(url: string) {
    this.url = url;
    this.socket = null;
    this.isConnected = false;
    this.userId = this.generateUserId();
    this.onConnectedUsersUpdate = null;
  }

  /**
   * Generate user ID from localStorage to track same browser session
   * @private
   */
  private generateUserId(): string {
    const stored = localStorage.getItem('summai_user_id');
    if (stored) return stored;
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('summai_user_id', userId);
    return userId;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener('open', (event: Event) => {
          console.log('WebSocket connected to:', this.url);
          this.isConnected = true;
          this.sendUserIdentification();
          resolve();
        });

        this.socket.addEventListener('message', (event: MessageEvent) => {
          this.handleIncomingMessage(event.data);
        });

        this.socket.addEventListener('error', (error: Event) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        this.socket.addEventListener('close', () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
        });
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        reject(err);
      }
    });
  }

  /**
   * Send user identification to server
   * @private
   */
  private sendUserIdentification(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'user-identify',
        userId: this.userId
      }));
      console.log('User ID sent:', this.userId);
    }
  }

  /**
   * Handle incoming messages from server
   * @private
   */
  private handleIncomingMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log('WebSocket message received:', message);

      // Handle connected users updates
      if (message.connectedUsers && Array.isArray(message.connectedUsers)) {
        if (this.onConnectedUsersUpdate) {
          this.onConnectedUsersUpdate(message.connectedUsers);
        }
        console.log('Connected users:', message.connectedUsers);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  }

  /**
   * Register callback for connected users updates
   */
  setOnConnectedUsersUpdate(callback: (users: string[]) => void): void {
    this.onConnectedUsersUpdate = callback;
  }

  /**
   * Send message through WebSocket
   */
  send(message: object | string): void {
    if (this.isConnected && this.socket) {
      const jsonMessage = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(jsonMessage);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): boolean {
    return this.isConnected;
  }
}
