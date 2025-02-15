from flask import Flask, jsonify, session, redirect, request, url_for
from flask_cors import CORS
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'thisisSECRET1340iu5203u5103'
CORS(app, supports_credentials=True)

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly'
]

class CalendarAPI:
    def __init__(self):
        self.auth_state = None
        self.creds = None
        self.service = None

    def login(self) -> str:
        # Check if we have valid credentials
        if os.path.exists('token.json'):
            self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            if self.creds.valid:
                self.instantiate()
                return ''

        # If creds are expired but we have a refresh token
        if self.creds and self.creds.expired and self.creds.refresh_token:
            self.creds.refresh(Request())
            self.instantiate()
            return ''

        # Otherwise, need to get new credentials
        flow = Flow.from_client_secrets_file('client_secret.json', SCOPES)
        flow.redirect_uri = url_for('callback', _external=True)
        auth_url, self.auth_state = flow.authorization_url(
            access_type='offline',
            prompt='consent'
        )
        return auth_url

    def login_callback(self, auth_response):
        flow = Flow.from_client_secrets_file(
            'client_secret.json',
            scopes=SCOPES,
            state=self.auth_state
        )
        flow.redirect_uri = url_for('callback', _external=True)
        
        flow.fetch_token(authorization_response=auth_response)
        self.creds = flow.credentials
        
        # Save credentials for future use
        with open('token.json', 'w') as token:
            token.write(self.creds.to_json())
            
        self.instantiate()

    def instantiate(self):
        self.service = build('calendar', 'v3', credentials=self.creds)

    def get_events(self):
        if not self.creds or not self.creds.valid:
            return None
            
        ten_days_ago = datetime.utcnow() - timedelta(days=10)
        time_min = ten_days_ago.isoformat() + 'Z'
        
        events_result = self.service.events().list(
            calendarId='primary',
            timeMin=time_min,
            maxResults=200,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])

# Create global instance
calendar_api = CalendarAPI()

@app.route('/login')
def login():
    auth_url = calendar_api.login()
    if auth_url:
        session['state'] = calendar_api.auth_state
        return redirect(auth_url)
    return redirect('http://localhost:3000/lee')

@app.route('/callback')
def callback():
    calendar_api.login_callback(request.url)
    return redirect('http://localhost:3000/lee')

@app.route('/api/events', methods=['GET'])
def get_events():
    events = calendar_api.get_events()
    if events is None:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify({'events': events})

@app.route('/api/auth-status', methods=['GET'])
def auth_status():
    is_authenticated = calendar_api.creds and calendar_api.creds.valid
    return jsonify({'isAuthenticated': is_authenticated})

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True, port=5000)