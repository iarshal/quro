/**
 * websocket.ts — Persistent WebSocket client for Quro real-time features
 * 
 * Handles: messaging, call signaling, read receipts, presence.
 * Auto-reconnects on disconnect. Singleton pattern.
 */

type MessageHandler = (data: any) => void;

const WS_BASE = typeof window !== 'undefined'
  ? `ws://${window.location.hostname}:8000`
  : 'ws://localhost:8000';

class QuroWebSocket {
  private ws: WebSocket | null = null;
  private userId: string = '';
  private token: string = '';
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private pendingCallOffers: Map<string, any> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private messageQueue: any[] = [];

  /** Connect to the WebSocket hub */
  connect(userId: string, token: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId === userId) return;
    this.userId = userId;
    this.token = token;
    this.doConnect();
  }

  private doConnect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(`${WS_BASE}/ws/chat/${this.userId}?token=${this.token}`);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('[WS] Connected');
        // Flush queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          this.ws?.send(JSON.stringify(msg));
        }
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'call_offer' && data.from) {
            this.pendingCallOffers.set(data.from, data);
          }
          this.emit(data.type, data);
        } catch { /* ignore non-JSON */ }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        console.log('[WS] Disconnected — reconnecting in 3s');
        this.emit('disconnected', {});
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.userId) this.doConnect();
    }, 3000);
  }

  /** Send a JSON message through the WebSocket */
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }

  /** Send a chat message to another user */
  sendMessage(toUserId: string, content: string, contentType: string = 'text') {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.send({
      type: 'message',
      id: msgId,
      to: toUserId,
      content,
      content_type: contentType,
      timestamp: new Date().toISOString(),
    });
    return msgId;
  }

  /** Mark messages as read */
  sendReadReceipt(toUserId: string) {
    this.send({
      type: 'read_receipt',
      to: toUserId,
      timestamp: new Date().toISOString(),
    });
  }

  /** Call signaling */
  sendCallOffer(toUserId: string, sdp: string, callType: 'audio' | 'video') {
    this.send({ type: 'call_offer', to: toUserId, sdp, call_type: callType });
  }

  sendCallAnswer(toUserId: string, sdp: string) {
    this.send({ type: 'call_answer', to: toUserId, sdp });
  }

  sendIceCandidate(toUserId: string, candidate: RTCIceCandidateInit) {
    this.send({ type: 'ice_candidate', to: toUserId, candidate });
  }

  sendCallReject(toUserId: string) {
    this.send({ type: 'call_reject', to: toUserId });
  }

  sendCallEnd(toUserId: string) {
    this.send({ type: 'call_end', to: toUserId });
  }

  getPendingCallOffer(fromUserId: string) {
    return this.pendingCallOffers.get(fromUserId) || null;
  }

  consumePendingCallOffer(fromUserId: string) {
    const offer = this.pendingCallOffers.get(fromUserId) || null;
    this.pendingCallOffers.delete(fromUserId);
    return offer;
  }

  /** Subscribe to a message type */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => { this.handlers.get(type)?.delete(handler); };
  }

  private emit(type: string, data: any) {
    this.handlers.get(type)?.forEach(h => h(data));
    this.handlers.get('*')?.forEach(h => h(data)); // wildcard
  }

  /** Disconnect */
  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.ws?.close();
    this.ws = null;
    this.userId = '';
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton
export const quroWS = new QuroWebSocket();
