class WebSocketService {
  constructor() {
    this.socket = null
    this.messageHandlers = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect(conversationId) {
    if (this.socket) {
      this.disconnect()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${conversationId}/`
    
    this.socket = new WebSocket(wsUrl)
    
    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleMessage(data)
    }

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event)
      this.attemptReconnect(conversationId)
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  attemptReconnect(conversationId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts})`)
        this.connect(conversationId)
      }, 1000 * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  sendMessage(type, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, ...data }))
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler)
  }

  handleMessage(data) {
    const handler = this.messageHandlers.get(data.type)
    if (handler) {
      handler(data)
    }
  }
}

export const websocketService = new WebSocketService()