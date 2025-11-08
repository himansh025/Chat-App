import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { conversationsAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { 
  Send, 
  Plus, 
  Square,
  Edit3,
  User,
  Bot 
} from 'lucide-react'

const Chat = () => {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [conversation, setConversation] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const messagesEndRef = useRef(null)
  
  const {
    messages,
    sendMessage,
    isConnected,
    isTyping,
    sendTypingIndicator
  } = useWebSocket(conversationId)

  useEffect(() => {
    if (conversationId) {
      loadConversation()
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      const response = await conversationsAPI.retrieve(conversationId)
      setConversation(response.data)
      setTitle(response.data.title)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await conversationsAPI.create({
        title: 'New Conversation',
        participants: ['User']
      })
      navigate(`/chat/${response.data.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const updateTitle = async () => {
    try {
      await conversationsAPI.update(conversationId, { title })
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  const endConversation = async () => {
    try {
      await conversationsAPI.end(conversationId)
      navigate('/')
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && conversationId) {
      sendMessage(inputMessage.trim())
      setInputMessage('')
      sendTypingIndicator(false)
    }
  }

  const handleInputChange = (e) => {
    setInputMessage(e.target.value)
    sendTypingIndicator(e.target.value.length > 0)
  }

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a new conversation to begin chatting with AI.
          </p>
          <div className="mt-6">
            <button
              onClick={createNewConversation}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={updateTitle}
                onKeyPress={(e) => e.key === 'Enter' && updateTitle()}
                className="text-lg font-semibold border-b border-gray-300 focus:outline-none focus:border-primary-500"
                autoFocus
              />
            ) : (
              <>
                <h1 className="text-lg font-semibold text-gray-900">
                  {conversation?.title || 'Loading...'}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              conversation?.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            
            {conversation?.status === 'active' && (
              <button
                onClick={endConversation}
                className="btn-secondary flex items-center"
              >
                <Square className="h-4 w-4 mr-2" />
                End Chat
              </button>
            )}
            
            <button
              onClick={createNewConversation}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </button>
          </div>
        </div>
        
        {conversation && (
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Started: {new Date(conversation.start_ts).toLocaleString()}</span>
            {conversation.participants.length > 0 && (
              <span>Participants: {conversation.participants.join(', ')}</span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start a conversation by sending a message below.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-primary-600 text-white ml-3' 
                    : 'bg-gray-300 text-gray-700 mr-3'
                }`}>
                  {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={message.sender === 'user' ? 'message-user' : 'message-ai'}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex max-w-xs lg:max-w-md">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center mr-3">
                <Bot className="h-4 w-4" />
              </div>
              <div className="message-ai">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="input-field flex-1"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat