from flask import Flask, jsonify, session, redirect, request, url_for
from flask_cors import CORS
import os
import pytz
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from datetime import datetime, timedelta
from groq_engine import SchedulingAgent, EditOrDeleteIntentAgent, get_groq_welcome
from search_engine import stringify_event, update_events_in_chroma, search_events
from groq import Groq
import json
import os
from speech_to_text import SpeechToTextAssistant

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP connections in development

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
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/directory.readonly',
    'https://www.googleapis.com/auth/contacts.other.readonly',
    'https://www.googleapis.com/auth/peopleapi.readonly'
]

class CalendarAPI:
    def __init__(self):
        self.auth_state = None
        self.creds = None
        self.service = None
        self.people_service = None

    def login(self) -> str:
        # Check if we have valid credentials
        if os.path.exists('token.json'):
            try:
                self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
                if self.creds.valid:
                    self.instantiate()
                    return ''
                    
                # If creds are expired but we have a refresh token
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    try:
                        self.creds.refresh(Request())
                        self.instantiate()
                        return ''
                    except Exception as e:
                        print(f"Error refreshing token: {str(e)}")
                        # Delete invalid token file
                        os.remove('token.json')
            except Exception as e:
                print(f"Error loading credentials: {str(e)}")
                # Delete invalid token file
                os.remove('token.json')

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
        self.people_service = build('people', 'v1', credentials=self.creds)

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

    def delete_calendar_event(self, event_id):
        try:
            self.service.events().delete(
                calendarId='primary',
                eventId=event_id
            ).execute()
            return {
                'status': 'success',
                'message': 'Event successfully deleted'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to delete event: {str(e)}'
            }

    def edit_calendar_event(self, event_id, updates):
        try:
            # First get the existing event
            event = self.service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            # Update the event with new details
            for key, value in updates.items():
                event[key] = value
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event
            ).execute()
            
            return {
                'status': 'success',
                'message': 'Event successfully updated',
                'event': updated_event
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to update event: {str(e)}'
            }

    def process_edit_request(self, event_id, query):
        try:
            # First get the existing event
            event = self.service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()

            # Initialize Groq client
            groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
            
            system_prompt = """You are a calendar event editor. Given an existing event in Google Calendar JSON format and a user's edit request, determine what changes need to be made to the event.

            Your task is to:
            1. Analyze the edit request
            2. Compare it with the current event details
            3. Return ONLY the fields that need to be updated in the exact Google Calendar API format

            IMPORTANT: Your response must be ONLY valid JSON with no additional text or markdown formatting.

            Output format must be valid JSON with ONLY the fields that need updating:
            {
                "summary": "Updated title if changed",
                "description": "Updated description if changed",
                "start": {
                    "dateTime": "YYYY-MM-DDTHH:mm:ss-07:00",
                    "timeZone": "America/Los_Angeles"
                },
                "end": {
                    "dateTime": "YYYY-MM-DDTHH:mm:ss-07:00",
                    "timeZone": "America/Los_Angeles"
                },
                "location": "Updated location if changed"
            }

            Rules:
            1. Only include fields that need to be changed
            2. Maintain event duration unless specifically requested to change
            3. Use ISO format for dates with timezone (-07:00 for PDT)
            4. If moving an event, adjust both start and end times
            5. Preserve existing fields not mentioned in the edit request
            6. For recurring events, specify if this is a single instance update
            7. MOST IMPORTANT: Return ONLY the JSON object, no other text

            Examples of valid responses:
            {"summary": "Team Sync"}
            {"start": {"dateTime": "2024-03-20T15:00:00-07:00", "timeZone": "America/Los_Angeles"}, "end": {"dateTime": "2024-03-20T16:00:00-07:00", "timeZone": "America/Los_Angeles"}}
            {"location": "https://zoom.us/j/123456789"}"""

            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"""Current event: {json.dumps(event)}
                        Edit request: {query}
                        
                        Return only the JSON object with fields to update."""
                    }
                ],
                model="llama3-70b-8192",
                temperature=0.1  # Low temperature for more precise outputs
            )

            response_content = chat_completion.choices[0].message.content.strip()
            
            # Clean up the response - remove any markdown formatting or extra text
            if "```json" in response_content:
                response_content = response_content.split("```json")[1].split("```")[0].strip()
            elif "```" in response_content:
                response_content = response_content.split("```")[1].strip()
            
            # Try to find a JSON object if there's additional text
            import re
            json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
            if json_match:
                response_content = json_match.group(0)

            print("edit request response: ", response_content)

            try:
                updates = json.loads(response_content)
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON: {response_content}")
                return {
                    'status': 'error',
                    'message': 'Failed to generate valid update instructions',
                    'details': f"Original response: {response_content}"
                }
            
            # Validate the updates
            valid_fields = {'summary', 'description', 'start', 'end', 'location', 'attendees'}
            if not all(key in valid_fields for key in updates.keys()):
                invalid_fields = [key for key in updates.keys() if key not in valid_fields]
                return {
                    'status': 'error',
                    'message': f'Invalid fields in update: {invalid_fields}',
                    'details': f"Original response: {response_content}"
                }
            
            # Update the event with new details
            for key, value in updates.items():
                event[key] = value
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event
            ).execute()
            
            return {
                'status': 'success',
                'message': 'Event successfully updated',
                'event': updated_event,
                'updates': updates  # Include what was changed for transparency
            }
            
        except json.JSONDecodeError as e:
            return {
                'status': 'error',
                'message': 'Failed to parse update instructions',
                'details': str(e)
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to update event: {str(e)}',
                'details': str(e)
            }

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
    
    try:
        success = update_events_in_chroma(events)
        if not success:
            return jsonify({'error': 'Failed to update search index'}), 500
        print("Events successfully updated in Chroma")
    except Exception as e:
        print(f"Error updating events in Chroma: {str(e)}")
        return jsonify({'error': f'Failed to update search index: {str(e)}'}), 500

    return jsonify({'events': events})

@app.route('/api/search', methods=['GET'])
def search_calendar():
    query = request.args.get('q')
    if not query:
        return jsonify({'error': 'No search query provided'}), 400

    # Get number of results from query params, default to 5
    n_results = int(request.args.get('n', 5))
    
    try:
        search_results = search_events(query, n_results)
        if search_results is None:
            return jsonify({'error': 'Search failed'}), 500
            
        # concatenate the best 3 matches
        best_matches = search_results['documents'][0][:3]
        prompt = f"""You are looking at a calendar event with this exact information: "{best_matches}"

            Question: "{query}"
            Today's date: {datetime.now().strftime("%Y-%m-%d")}

            Rules for your response:
            1. ONLY use information explicitly stated in the event details
            2. If asked about timing, include the EXACT date and time from the event
            3. If information is not in the event details, say "I don't see that information in the event"
            4. Keep responses under 20 words
            5. Do not make assumptions about recurring events
            6. Keep in mind today's date is {datetime.now().strftime("%Y-%m-%d")}

            Respond with ONLY the answer, no explanations or pleasantries."""
        
        groq_response = SchedulingAgent.get_groq_response(prompt)
        response = {
            'matches': best_matches,
            'answer': groq_response
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error during search: {str(e)}")
        return jsonify({'error': f'Search failed: {str(e)}'}), 500

@app.route('/api/auth-status', methods=['GET'])
def auth_status():
    is_authenticated = calendar_api.creds and calendar_api.creds.valid
    return jsonify({'isAuthenticated': is_authenticated})

@app.route('/api/schedule', methods=['POST'])
def schedule_event():
    response_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true'
    }
    
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
            scheduling_agent = SchedulingAgent(calendar_api.service, calendar_api.people_service)
        
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


@app.route('/api/editOrDelete', methods=['POST'])
def edit_or_delete():
    response_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Credentials': 'true'
    }
    
    if request.method == 'OPTIONS':
        return ('', 204, response_headers)

    if not calendar_api.service:
        return jsonify({
            'status': 'error',
            'message': 'Not authenticated'
        }), 401, response_headers

    try:
        data = request.get_json()
        
        if not data or 'query' not in data or 'event' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: query and event'
            }), 400, response_headers

        # Initialize the EditOrDeleteIntentAgent
        intent_agent = EditOrDeleteIntentAgent()
        
        # Get the intent from the query
        intent_result = intent_agent.extract_intent(data['query'])
        
        if intent_result.intent == "EDIT":
            result = calendar_api.process_edit_request(
                data['event']['id'],
                data['query']
            )
            return jsonify(result), 200 if result['status'] == 'success' else 400, response_headers
            
        elif intent_result.intent == "DELETE":
            result = calendar_api.delete_calendar_event(data['event']['id'])
            return jsonify(result), 200 if result['status'] == 'success' else 400, response_headers
            
        else:  # UNKNOWN
            return jsonify({
                'status': 'unknown',
                'message': "I'm not sure if you want to edit or delete this event. Please try rephrasing your request."
            }), 200, response_headers

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to process edit/delete request: {str(e)}'
        }), 500, response_headers


@app.route('/api/welcome_msg', methods=['POST'])
def set_welcome_message():
    events = request.get_json()
    if isinstance(events, str):
        events = json.loads(events)  # Parse if it's a string

    events_data = list(events.values())[0]

    la_tz = pytz.timezone('America/Los_Angeles')
    today_info = datetime.now(la_tz)
    today = datetime.now(la_tz).date()

    # Filter function
    def is_event_today(event):
        try:
            # Parse the datetime string from the event
            event_datetime = datetime.fromisoformat(
                event['start']['dateTime'].replace('Z', '+00:00')
            )
            
            # Convert to LA timezone if different
            if event['start']['timeZone'] != 'America/Los_Angeles':
                event_datetime = event_datetime.astimezone(la_tz)
                
            # Compare only the date portion
            return event_datetime.date() == today and event_datetime.ctime() > today_info.ctime()
            
        except (KeyError, ValueError):
            return False
    
    # Filter the events
    events_today = list(filter(is_event_today, events_data))
        
    day_summary = get_groq_welcome(events_today, today_info.ctime())
    # print(day_summary)

    return jsonify({'message': day_summary})


speech_assistant = SpeechToTextAssistant()

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    try:
        audio_file = request.files['audio']
        audio_data = audio_file.read()
        
        # Process the audio data
        audio_bytes = speech_assistant.process_audio_data(audio_data)
        
        # Transcribe using Groq
        transcribed_text = speech_assistant.speech_to_text_g(audio_bytes)
        print('*'*20)
        print(transcribed_text)
        print('*'*20)

        
        if transcribed_text:
            return jsonify({'text': transcribed_text})
        else:
            return jsonify({'error': 'Failed to transcribe audio'}), 500
            
    except Exception as e:
        print(f"Error in speech to text: {str(e)}")
        return jsonify({'error': str(e)}), 500
    




if __name__ == '__main__':
    app.run(debug=True, use_reloader=True, port=5000)