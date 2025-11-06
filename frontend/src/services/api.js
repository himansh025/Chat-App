import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

export const conversationsAPI = {
  list: (params) => api.get('/conversations/', { params }),
  create: (data) => api.post('/conversations/', data),
  retrieve: (id) => api.get(`/conversations/${id}/`),
  update: (id, data) => api.patch(`/conversations/${id}/`, data),
  end: (id) => api.post(`/conversations/${id}/end/`),
  query: (id, data) => api.post(`/conversations/${id}/query/`, data),
}

export const messagesAPI = {
  list: (params) => api.get('/messages/', { params }),
  create: (data) => api.post('/messages/', data),
}

export const aiAPI = {
  query: (data) => api.post('/ai/query/', data),
  search: (data) => api.post('/ai/search/', data),
}

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
}

export default api