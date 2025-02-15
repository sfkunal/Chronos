from flask import Flask, jsonify, session, redirect, request, url_for
from flask_cors import CORS
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from groq_engine import SchedulingAgent
# from search_engine import stringify_event, update_events_in_chroma, search_events

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP connections in development

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow OAuth2 over HTTP for development

app = Flask(__name__)
app.secret_key = 'thisisSECRET1340iu5203u5103'

# Simpler CORS configuration
CORS(app, 
     origins=["http://localhost:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type"],
     methods=["GET", "POST", "OPTIONS"])

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

# Create global instances
calendar_api = CalendarAPI()
scheduling_agent = None  # Will be initialized after authentication

@app.route('/')
def hello_world():
    return "hello world"

@app.route('/login')
def login():
    auth_url = calendar_api.login()
    if auth_url:
        session['state'] = calendar_api.auth_state
        return redirect(auth_url)
    return redirect('http://localhost:3000')

@app.route('/callback')
def callback():
    calendar_api.login_callback(request.url)
    return redirect('http://localhost:3000')

@app.route('/api/events', methods=['GET'])
def get_events():
    events = calendar_api.get_events()
    if events is None:
        return jsonify({'error': 'Not authenticated'}), 401
    
    print("Events retrieved from Google Calendar")
    
    # try:
    #     success = update_events_in_chroma(events)
    #     if not success:
    #         return jsonify({'error': 'Failed to update search index'}), 500
    #     print("Events successfully updated in Chroma")
    # except Exception as e:
    #     print(f"Error updating events in Chroma: {str(e)}")
    #     return jsonify({'error': f'Failed to update search index: {str(e)}'}), 500

    return jsonify({'events': events})

# @app.route('/api/search', methods=['GET'])
# def search_calendar():
#     query = request.args.get('q')
#     if not query:
#         return jsonify({'error': 'No search query provided'}), 400

#     # Get number of results from query params, default to 5
#     n_results = int(request.args.get('n', 5))
    
#     try:
#         search_results = search_events(query, n_results)
#         if search_results is None:
#             return jsonify({'error': 'Search failed'}), 500
            
#         # Format the response
#         response = {
#             'query': query,
#             'matches': search_results['documents'][0],  # List of matching document texts
#             'distances': search_results['distances'][0], # Similarity scores
#             'metadatas': search_results['metadatas'][0] # Metadata for each match
#         }
        
#         return jsonify(response)
        
#     except Exception as e:
#         print(f"Error during search: {str(e)}")
#         return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/api/auth-status', methods=['GET'])
def auth_status():
    is_authenticated = calendar_api.creds and calendar_api.creds.valid
    return jsonify({'isAuthenticated': is_authenticated})

@app.route('/api/schedule', methods=['POST'])
def schedule_event():
    # Add CORS headers explicitly
    response_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true'
    }
    
    # Handle preflight request
    if request.method == 'OPTIONS':
        return ('', 204, response_headers)

    if not calendar_api.service:
        return jsonify({
            'status': 'error',
            'message': 'Not authenticated'
        }), 401, response_headers

    try:
        data = request.get_json()
        
        if not data or 'action_query' not in data or 'preferences' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: action_query and preferences'
            }), 400, response_headers

        # Initialize scheduling agent if needed
        global scheduling_agent
        if scheduling_agent is None:
            scheduling_agent = SchedulingAgent(calendar_api.service)
        
        # Process the scheduling request
        event_details = scheduling_agent.process_request(
            data['action_query'],
            data['preferences']
        )
        
        # Check for errors in event details
        if isinstance(event_details, dict) and event_details.get('status') == 'error':
            return jsonify({
                'status': 'error',
                'message': event_details['message'],
                'details': event_details.get('raw_response', '')
            }), 400, response_headers
            
        # Create the calendar event
        response = scheduling_agent.create_calendar_event(event_details)
        
        # Add headers to responses
        if response.get('status') == 'error':
            return jsonify(response), 400, response_headers
            
        return jsonify(response), 200, response_headers

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to process scheduling request: {str(e)}'
        }), 500, response_headers

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True, port=5000)