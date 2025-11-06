import { useEffect, useRef, useState } from 'react'
import { websocketService } from '../services/websocket'

export const useWebSocket = (conversationId) => {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!conversationId) return

    websocketService.connect(conversationId)

    // Set up message handlers
    websocketService.onMessage('message_ack', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.temp_id === data.temp_id 
          ? { ...msg, id: data.message_id, timestamp: data.timestamp }
          : msg
      ))
    })

    websocketService.onMessage('llm_token', (data) => {
      setIsTyping(true)
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.sender === 'ai' && !lastMessage.finalized) {
          // Update existing AI message
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + data.token
          }
          return updated
        } else {
          // Create new AI message
          return [
            ...prev,
            {
              id: 'temp-ai',
              sender: 'ai',
              content: data.token,
              timestamp: new Date().toISOString(),
              finalized: false
            }
          ]
        }
      })
    })

    websocketService.onMessage('llm_done', (data) => {
      setIsTyping(false)
      setMessages(prev => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        if (lastMessage?.sender === 'ai') {
          updated[updated.length - 1] = {
            ...lastMessage,
            id: data.message_id,
            content: data.text,
            finalized: true
          }
        }
        return updated
      })
    })

    websocketService.onMessage('typing_indicator', (data) => {
      if (data.user_id !== 'current-user') {
        setIsTyping(data.is_typing)
      }
    })

    return () => {
      websocketService.disconnect()
    }
  }, [conversationId])

  const sendMessage = (content) => {
    const temp_id = 'temp-' + Date.now()
    const userMessage = {
      id: temp_id,
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
      temp_id
    }

    setMessages(prev => [...prev, userMessage])
    websocketService.sendMessage('user_message', { content, temp_id })
  }

  const sendTypingIndicator = (isTyping) => {
    websocketService.sendMessage('typing_indicator', { is_typing: isTyping })
  }

  return {
    messages,
    sendMessage,
    isConnected,
    isTyping,
    sendTypingIndicator
  }
}