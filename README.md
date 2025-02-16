# Chronos Calendar
TreeHacks 2025

### How to run:
#### Front-end
```bash
cd chronos-frontend
npm i
npm run dev
```

#### Back-end:
```bash
cd chronos-backend
pip install -r requirements.txt

# Set chronos-backend/.env variables
FLASK_APP=...
FLASK_ENV=...
GROQ_API_KEY=...
CHROMA_TENANT_KE=...
CHROMA_API_KEY=...
OPENAI_API_KEY=...

python app.py
```