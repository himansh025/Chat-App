# AI Chat Application

A real-time conversational AI platform with semantic search across chat history.

## Features

- **Real-time AI Chat** - Streamed responses via WebSockets
- **Semantic Search** - Natural language queries across all conversations
- **Smart Summaries** - Automatic conversation analysis and key points
- **Cross-Chat Intelligence** - Ask questions spanning your entire chat history

## Tech Stack

**Backend:** Django, Django Channels, PostgreSQL (pgvector), Redis, Celery  
**Frontend:** React, Vite, Tailwind CSS  
**AI:** OpenAI API with vector embeddings

## Quick Start

### Prerequisites
- Python 3.11+, Node.js 18+, PostgreSQL 13+, Redis 7+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database with pgvector
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Configure .env file
cp .env.example .env
# Add: OPENAI_API_KEY, database credentials, REDIS_URL

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver  # Terminal 1
celery -A core worker --loglevel=info  # Terminal 2
```

### Frontend Setup
```bash
cd app 
npm install
npm run dev
```

**Access:** Frontend at `http://localhost:3000`, Backend at `http://localhost:8000`

### Docker (Alternative)
```bash
docker-compose up --build
```

## Key Configuration

Create `backend/.env`:
```bash
SECRET_KEY=your-secret-key
DB_NAME=chatdb
DB_USER=user
DB_PASSWORD=pass
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=your-openai-key
```

## API Endpoints

- `GET /api/conversations/` - List conversations
- `POST /api/conversations/` - Create conversation
- `POST /api/ai/query/` - Semantic search across chats
- `ws://localhost:8000/ws/chat/{id}/` - WebSocket chat

## Usage

1. **Start chatting** - Create new conversation from dashboard
2. **End conversation** - Triggers automatic summary and analysis
3. **Search history** - Use Intelligence page to query across all chats

## Development

```bash
# Run tests
python manage.py test
cd frontend && npm test

# Load sample data
python manage.py loaddata sample_conversations.json
```
