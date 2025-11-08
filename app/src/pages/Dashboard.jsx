import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { conversationsAPI } from '../services/api'
import { 
  Plus, 
  MessageSquare, 
  Calendar,
  Clock,
  Search 
} from 'lucide-react'

const Dashboard = () => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await conversationsAPI.list()
      setConversations(response.data.results || response.data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await conversationsAPI.create({
        title: 'New Conversation',
        participants: ['User']
      })
      window.location.href = `/chat/${response.data.id}`
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const filteredConversations = conversations.filter(convo =>
    convo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <button
          onClick={createNewConversation}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations Grid */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new conversation.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/conversation/${conversation.id}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {conversation.title}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  conversation.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {conversation.status}
                </span>
              </div>
              
              {conversation.summary && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {conversation.summary}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(conversation.start_ts).toLocaleDateString()}
                  </div>
                  {conversation.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.round(conversation.duration / 60)} min
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  {conversation.message_count || 0} messages
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard