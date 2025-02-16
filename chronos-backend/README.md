# Chronos Backend

A sophisticated calendar management system built with Flask, leveraging Google Calendar API and Groq's LLM capabilities for intelligent scheduling and event management.

## 🏗 Architecture

### Core Components

- **Flask Server**: REST API handling calendar operations
- **Google Calendar Integration**: Direct interface with user's Google Calendar
- **LLM Integration**: Groq-powered natural language processing for event scheduling
- **Vector Search**: ChromaDB for efficient calendar event searching
- **Contact Management**: Google People API integration for contact lookup

### Key Services

1. **Intent Classification**
   - Analyzes user requests to determine scheduling intentions
   - Categories: CREATE, DELETE, EDIT, UNKNOWN
   - Powered by Groq's LLaMA 3.3 70B model

2. **Scheduling Engine**
   - Natural language processing for event creation
   - Preference-aware scheduling
   - Timezone handling (America/Los_Angeles)
   - Attendee management

3. **Search Engine**
   - Vector-based search using ChromaDB
   - Sentence transformer embeddings
   - Efficient event lookup and retrieval

4. **Contact Management**
   - Email lookup functionality
   - Integration with Google Contacts
   - Attendee validation

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Google Cloud Platform account
- Groq API key
- ChromaDB account

### Environment Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Unix/macOS
.\venv\Scripts\activate   # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT_KEY=your_chroma_tenant_key
```

4. Set up Google OAuth:
   - Create a project in Google Cloud Console
   - Enable Calendar API and People API
   - Create OAuth 2.0 credentials
   - Download and rename credentials as `client_secret.json`

### Running the Server

```bash
python app.py
```
Server will start on `http://localhost:5000`

## 🔑 API Endpoints

### Authentication
- `GET /login` - Initiates Google OAuth flow
- `GET /callback` - OAuth callback handler
- `GET /api/auth-status` - Check authentication status

### Calendar Operations
- `GET /api/events` - Retrieve calendar events
- `POST /api/schedule` - Schedule new events
- `POST /api/editOrDelete` - Modify or remove events
- `GET /api/search` - Search calendar events
- `POST /api/welcome_msg` - Generate welcome message

## ⚡ Performance Considerations

### Optimization Features
- Chunked event processing (10 events per chunk)
- Efficient vector search implementation
- Background processing for long-running tasks
- Response streaming for real-time updates

### Technical Limitations
- Rate limits apply to Google Calendar API
- ChromaDB query limitations
- LLM processing time variations

## 🔒 Security

- OAuth 2.0 authentication
- CORS protection
- Environment variable management
- Secure credential handling

## 🛠 Development

### Adding New Features
1. Create new route in `app.py`
2. Implement corresponding service logic
3. Update relevant agent classes
4. Add error handling and validation

### Testing
```bash
# Run tests (to be implemented)
python -m pytest
```

## 📦 Dependencies

Key packages and their purposes:
- `flask`: Web framework
- `google-auth`: Google OAuth handling
- `groq`: LLM integration
- `chromadb`: Vector database
- `sentence-transformers`: Text embeddings
- `pydantic`: Data validation
- `pytz`: Timezone handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.