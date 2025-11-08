import React, { useState } from 'react'
import { aiAPI } from '../services/api'
import { Search, Bot, MessageSquare, Calendar, User } from 'lucide-react'

const Intelligence = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    
    try {
      const response = await aiAPI.query({ query })
      setResults(response.data)
    } catch (err) {
      setError('Failed to search conversations')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Conversation Intelligence</h1>
        <p className="text-gray-600">
          Ask questions across all your conversations and get AI-powered insights.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your conversations, e.g., 'What decisions did I make about project X?'"
            className="input-field pl-10 pr-24 text-lg py-3"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* AI Answer */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">AI Answer</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{results.answer}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          {results.sources && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Sources</h3>
              
              {/* Conversation Sources */}
              {results.sources.conversations && results.sources.conversations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Relevant Conversations</h4>
                  <div className="space-y-3">
                    {results.sources.conversations.map((convo) => (
                      <div key={convo.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{convo.title}</h5>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            Similarity: {(1 - convo.similarity).toFixed(3)}
                          </span>
                        </div>
                        {convo.summary && (
                          <p className="text-sm text-gray-600 mb-2">{convo.summary}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(convo.start_ts).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Sources */}
              {results.sources.messages && results.sources.messages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Relevant Messages</h4>
                  <div className="space-y-3">
                    {results.sources.messages.map((msg) => (
                      <div key={msg.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                              msg.sender === 'user' 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-gray-300 text-gray-700'
                            }`}>
                              {msg.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {msg.conversation_title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            {(1 - msg.similarity).toFixed(3)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{msg.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !loading && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No search yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ask a question to search through your conversations.
          </p>
        </div>
      )}
    </div>
  )
}

export default Intelligence