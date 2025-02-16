# Chronos Calendar

A next-generation calendar application powered by Large Language Models, offering natural language scheduling and intelligent event management. Built for TreeHacks 2025.

## 🌟 Overview

Chronos reimagines calendar management through natural language processing and intelligent agents. Users can schedule, modify, and search events using conversational language, while the system handles complex scheduling logic, preference management, and calendar optimization.

## 🤖 Intelligent Agents

### Intent Agent
- Classifies user requests into CREATE, DELETE, EDIT, or UNKNOWN
- Powered by Groq's LLaMA 3.3 70B model
- Enables context-aware response handling

### Availability Agent
- Analyzes calendar for free/busy times
- Considers timezone constraints (America/Los_Angeles)
- Generates human-readable availability summaries

### Preferences Agent
- Converts natural language preferences into structured rules
- Handles work hours, social time, and recurring patterns
- Ensures scheduling respects user constraints

### Search Agent
- Vector-based calendar search using ChromaDB
- Semantic understanding of event context
- Real-time event lookup and retrieval

### Mutability Agent
- Handles event modifications and deletions
- Preserves event integrity during changes
- Manages recurring event patterns

### Scheduling Agent
- Orchestrates all other agents
- Handles complex scheduling logic
- Manages Google Calendar integration

## 🎯 Key Features

### Natural Language Interface
```
"Schedule lunch with Connor next Wednesday at noon"
"Move my 2pm meeting to tomorrow morning"
"What meetings do I have this week?"
```

### Smart Calendar Views
- Monthly overview with preference highlighting
- Weekly detailed view with real-time updates
- Integrated chat interface for natural interaction

### Preference-Aware Scheduling
- Learning from user patterns
- Time-block restrictions
- Custom scheduling rules

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x+
- Python 3.8+
- Google Cloud Platform account
- Groq API key
- ChromaDB account

### Frontend Setup
```bash
cd chronos-frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd chronos-backend
pip install -r requirements.txt

# Configure environment variables
FLASK_APP=app.py
FLASK_ENV=development
GROQ_API_KEY=your_key
CHROMA_TENANT_KEY=your_key
CHROMA_API_KEY=your_key
OPENAI_API_KEY=your_key

python app.py
```

## 🛠 Technology Stack

### Frontend
- Next.js 13+
- React
- Tailwind CSS
- shadcn/ui
- Google Calendar API

### Backend
- Flask
- Groq LLM
- ChromaDB
- Google Calendar/People APIs
- Sentence Transformers

## 📊 System Architecture

```
User Input (Natural Language)
         ↓
Intent Classification
         ↓
Agent Orchestration ←→ Preference Rules
         ↓
Calendar Operations ←→ Google Calendar
         ↓
Real-time Updates
```

## 🔒 Security & Performance

- OAuth 2.0 authentication
- Rate limiting and request throttling
- Chunked event processing
- Vector search optimization
- Real-time response streaming

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.