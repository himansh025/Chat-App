import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { conversationsAPI } from '../services/api'
import { Calendar, Clock, User, Bot, MessageSquare, Download } from 'lucide-react'

const ConversationDetails = () => {
  const { id } = useParams()
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversation()
  }, [id])

  const loadConversation = async () => {
    try {
      const response = await conversationsAPI.retrieve(id)
      setConversation(response.data)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportConversation = () => {
    if (!conversation) return

    const content = `Conversation: ${conversation.title}
Date: ${new Date(conversation.start_ts).toLocaleString()}
Participants: ${conversation.participants.join(', ')}
Status: ${conversation.status}
Summary: ${conversation.summary}

Messages:
${conversation.messages.map(msg => `
${msg.sender.toUpperCase()} (${new Date(msg.timestamp).toLocaleString()}):
${msg.content}
`).join('\n')}`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${conversation.title}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Conversation not found</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{conversation.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(conversation.start_ts).toLocaleString()}
              </div>
              {conversation.end_ts && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Duration: {Math.round(conversation.duration / 60)} minutes
                </div>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                conversation.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {conversation.status}
              </span>
            </div>
          </div>
          <button
            onClick={exportConversation}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>

        {/* Summary */}
        {conversation.summary && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{conversation.summary}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">Participants</span>
            <p className="text-gray-600">{conversation.participants.join(', ')}</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Messages</span>
            <p className="text-gray-600">{conversation.messages.length}</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Started</span>
            <p className="text-gray-600">{new Date(conversation.start_ts).toLocaleDateString()}</p>
          </div>
          {conversation.end_ts && (
            <div>
              <span className="font-medium text-gray-900">Ended</span>
              <p className="text-gray-600">{new Date(conversation.end_ts).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-xs lg:max-w-2xl ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-primary-600 text-white ml-3' 
                  : 'bg-gray-300 text-gray-700 mr-3'
              }`}>
                {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`bg-white border border-gray-200 rounded-lg p-4 ${
                message.sender === 'user' ? 'message-user' : 'message-ai'
              }`}>
                <p className="text-sm whitespace-pre-wrap mb-2">{message.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConversationDetails