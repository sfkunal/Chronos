from groq import Groq
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime, timedelta
import pytz
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

load_dotenv()

sample_action_query = "drink with connor on wednesday"
sample_preferences = [
    "I only take work calls between 6am - 4pm",
    "I socialize after 5pm everyday - midnight",
    "I party every wendesday block that off"
]

class IntentAgent():
    class Intents(BaseModel):
        intent: str

        @classmethod
        def model_validator(cls, values):
            if values.intent not in self.intents:
                raise ValueError(f"Intent must be one of {self.intents}")
            return values

    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.intents = ["CREATE", "DELETE", "EDIT", "UNKNOWN"]
        self.system_prompt = """You are an intent classifier for a calendar application. Your task is to analyze user requests and classify them into one of four possible intents: CREATE, DELETE, EDIT, or UNKNOWN.

            Guidelines for classification:
            - CREATE: Use when user wants to make a completely new calendar event with no reference to existing events (e.g., "let's meet tomorrow", "schedule a call")
            - DELETE: Use when user wants to remove an existing event (e.g., "cancel meeting", "remove appointment")
            - EDIT: Use when user wants to modify an existing event or mentions changing times/dates (e.g., "move meeting to 3pm", "instead of tomorrow", "reschedule to Wednesday", "change the time")
            - UNKNOWN: Use only if the request doesn't clearly fit the above categories

            Key indicators for EDIT:
            - Phrases like "instead of", "move to", "change to", "reschedule"
            - References to moving from one time/date to another
            - Any modification of an implied existing event

            Key indicators for CREATE:
            - Very simple phrases, that do not imply editing or deleting

            You must output EXACTLY ONE of these four words: CREATE, DELETE, EDIT, or UNKNOWN.

            Examples:
            "Let's have coffee tomorrow" → CREATE
            "Cancel my dentist appointment" → DELETE
            "Move my meeting to 3pm" → EDIT
            "Let's do dinner Wednesday instead of tomorrow" → EDIT
            "What's the weather like?" → UNKNOWN"""

    def extract_intent(self, query):
        chat_completion = self.groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user",
                    "content": query,
                }
            ],
            model="llama3-8b-8192",
        )
        response = chat_completion.choices[0].message.content
        return self.Intents(intent=response)

class AvailabilityAgent():
    def __init__(self, service):
        self.service = service

    def get_two_week_availability(self):
        now = datetime.now(pytz.UTC)
        one_week = now + timedelta(days=14)
        now_str = now.isoformat()
        week_str = one_week.isoformat()
        
        events_result = self.service.events().list(
            calendarId='primary',
            timeMin=now_str,
            timeMax=week_str,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        if not events:
            return "You have no events scheduled for the next week."
        
        days = {}
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
            day_key = start_dt.strftime('%Y-%m-%d')
            
            if day_key not in days:
                days[day_key] = []
            
            days[day_key].append({
                'summary': event.get('summary', 'Untitled event'),
                'start': start_dt,
                'end': datetime.fromisoformat(
                    event['end'].get('dateTime', event['end'].get('date')).replace('Z', '+00:00')
                )
            })
        
        summary = []
        for day_key in sorted(days.keys()):
            day_events = days[day_key]
            day_date = datetime.strptime(day_key, '%Y-%m-%d')
            day_str = day_date.strftime('%A, %B %d')
            
            events_str = []
            for event in day_events:
                time_str = f"{event['start'].strftime('%I:%M %p')} to {event['end'].strftime('%I:%M %p')}"
                events_str.append(f"{event['summary']} from {time_str}")
            
            day_summary = f"On {day_str}, you have {len(events_str)} event{'s' if len(events_str) > 1 else ''}: "
            day_summary += '; '.join(events_str)
            summary.append(day_summary)
        
        return "\n\n".join(summary)

class PreferencesAgent:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.system_prompt = """You are a preferences analyzer for a calendar application. Your task is to convert natural language preferences into strict time-based rules.

            For each preference, extract:
            1. The type of activity (work, social, etc.)
            2. The time constraints (start time and end time)
            3. The days it applies to
            4. Whether it's a blocking rule (prevents other activities) or a preference

            Output the rules in a structured JSON format like this:
            {
                "rules": [
                    {
                        "activity": "work_calls",
                        "start_time": "06:00",
                        "end_time": "16:00",
                        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
                        "blocking": true
                    }
                ]
            }

            If a preference is unclear or can't be converted to a rule, skip it."""

    def get_rule_based_preferences(self, preferences: list[str]):
        preferences_text = "\n".join([f"- {pref}" for pref in preferences])
        
        chat_completion = self.groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user",
                    "content": f"Convert these preferences to rules:\n{preferences_text}",
                }
            ],
            model="llama3-8b-8192",
        )
        
        return chat_completion.choices[0].message.content

class ContactAgent:
    def __init__(self, people_service):
        self.people_service = people_service

    def get_contacts(self, query=None, page_size=30):
        if not self.people_service:
            return None
        
        try:
            all_connections = []
            
            if query:
                # Search personal contacts
                try:
                    contact_results = self.people_service.people().searchContacts(
                        query=query,
                        readMask='names,emailAddresses,phoneNumbers',
                        pageSize=min(page_size, 30)
                    ).execute()
                    all_connections.extend(contact_results.get('results', []))
                except Exception as e:
                    print(f"Error searching contacts: {str(e)}")

                # Get all connections and filter locally
                try:
                    connections = self.people_service.people().connections().list(
                        resourceName='people/me',
                        pageSize=1000,
                        personFields='names,emailAddresses,phoneNumbers,metadata'
                    ).execute()
                    
                    # Filter connections manually based on query
                    query = query.lower()
                    for contact in connections.get('connections', []):
                        # Check email address
                        emails = contact.get('emailAddresses', [])
                        if any(query in email.get('value', '').lower() for email in emails):
                            all_connections.append(contact)
                            continue
                            
                        # Check names
                        names = contact.get('names', [])
                        if any(query in name.get('displayName', '').lower() for name in names):
                            all_connections.append(contact)
                
                except Exception as e:
                    print(f"Error listing connections: {str(e)}")
                
            else:
                # Get all contacts (no query)
                try:
                    connections = self.people_service.people().connections().list(
                        resourceName='people/me',
                        pageSize=min(page_size, 1000),
                        personFields='names,emailAddresses,phoneNumbers'
                    ).execute()
                    all_connections.extend(connections.get('connections', []))
                except Exception as e:
                    print(f"Error listing connections: {str(e)}")
            
            return all_connections
            
        except Exception as e:
            print(f"Error fetching contacts: {str(e)}")
            return None

    def email_lookup(self, query=None):            
        contacts = self.get_contacts(query)
        if contacts is None:
            return None
        
        email_matches = []
        for contact in contacts:
            names = contact.get('names', [])
            emails = contact.get('emailAddresses', [])
            
            if not emails:
                continue
                
            display_name = names[0].get('displayName') if names else emails[0].get('value')
            email_matches.append({
                'name': display_name,
                'email': emails[0].get('value')
            })
            
        return email_matches

class SchedulingAgent:
    def __init__(self, service, people_service):
        self.intent_agent = IntentAgent()
        self.availability_agent = AvailabilityAgent(service)
        self.preferences_agent = PreferencesAgent()
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.service = service
        self.people_service = people_service
        self.contacts = ContactAgent(people_service).email_lookup()
        print("contacts", self.contacts)
        pacific_tz = pytz.timezone('America/Los_Angeles')
        now = datetime.now(pacific_tz)
        current_date = now.strftime('%Y-%m-%d')
        current_time = now.strftime('%H:%M:%S')

        self.system_prompt = """You are a calendar scheduling assistant. Today's date is {} and the current time is {} Pacific Time.

        Given an action query and user preferences, generate a calendar event in the exact JSON format specified.
        Handle relative time expressions like:
        - "tomorrow", "next week", "in 3 days"
        - "this afternoon", "evening", "morning"
        - "next Monday", "this Friday"

        Your output must be valid JSON and match this structure exactly:
        {{
            "summary": "Brief title of event",
            "description": "Detailed description",
            "start": {{
                "dateTime": "YYYY-MM-DDTHH:mm:ss-HH:MM",
                "timeZone": "America/Los_Angeles"
            }},
            "end": {{
                "dateTime": "YYYY-MM-DDTHH:mm:ss-HH:MM",
                "timeZone": "America/Los_Angeles"
            }},
            "location": "Optional location",
            "attendees": [
                {{"email": "example@email.com"}}
            ],
            "reminders": {{
                "useDefault": true
            }}
        }}

        Rules:
        1. Times must be in exact ISO format with timezone offset
        2. Only summary, description, start, and end are required
        3. Default duration is 1 hour if not specified
        4. Use America/Los_Angeles timezone
        5. Extract attendee ONLY if emails are present in the query
        6. Extract location if present
        7. Always set reminders.useDefault to true
        8. ABOVE ALL, RESPECT THE AVAILABILITY PREFERENCES THAT A USER PROVIDES YOU""".format(current_date, current_time)

    def create_calendar_event(self, event_data):
        """
        Creates a Google Calendar event from either a JSON string or dictionary.
        Returns the created event details or error message.
        """
        try:
            # Handle input that could be either JSON string or dict
            if isinstance(event_data, str):
                # Clean up the JSON string
                json_str = event_data.strip()
                if "```" in json_str:
                    json_str = json_str.split("```")[1].split("```")[0]
                event_details = json.loads(json_str)
            elif isinstance(event_data, dict):
                event_details = event_data
            else:
                raise ValueError(f"Unexpected event data type: {type(event_data)}")
            
            # Validate required fields
            required_fields = ['summary', 'start', 'end']
            for field in required_fields:
                if field not in event_details:
                    raise ValueError(f"Missing required field: {field}")
            
            # Create the event using Google Calendar API
            event = self.service.events().insert(
                calendarId='primary',
                body=event_details
            ).execute()
            
            return {
                'status': 'success',
                'event_id': event.get('id'),
                'html_link': event.get('htmlLink'),
                'summary': event.get('summary')
            }
            
        except json.JSONDecodeError as e:
            return {
                'status': 'error',
                'message': f'Failed to parse JSON: {str(e)}',
                'raw_response': event_data
            }
        except ValueError as e:
            return {
                'status': 'error',
                'message': str(e)
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to create event: {str(e)}'
            }

    def process_request(self, action_query: str, preferences: list[str]):
        """Process a calendar request and return the event details"""
        try:
            intent = self.intent_agent.extract_intent(action_query)
            preference_rules = self.preferences_agent.get_rule_based_preferences(preferences)

            print("action_query", action_query)
            
            if intent.intent in ["CREATE", "EDIT"]:
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": self.system_prompt
                        },
                        {
                            "role": "user",
                            "content": f"""Action: {action_query}
                            User Preferences: {preference_rules}
                            Current Availability: {self.availability_agent.get_two_week_availability() if self.availability_agent else 'Not available'}
                            Contacts: {self.contacts}
                            
                            Generate a calendar event JSON that respects these preferences and availability.
                            Remember to include:
                            1. Start and end times in ISO format with timezone
                            2. Summary and description
                            3. Attendees ONLY IF an email is provided
                            4. Default 1 hour duration"""
                        }
                    ],
                    model="llama3-70b-8192",
                )
                
                llm_response = chat_completion.choices[0].message.content
                print("Raw LLM Response:", llm_response)  # Debug print
                
                # Parse and validate the response
                try:
                    # Clean up the JSON string
                    if isinstance(llm_response, str):
                        json_str = llm_response.strip()
                        if "```json" in json_str:
                            json_str = json_str.split("```json")[1].split("```")[0]
                        elif "```" in json_str:
                            json_str = json_str.split("```")[1].split("```")[0]
                        event_details = json.loads(json_str)
                    else:
                        event_details = llm_response

                    # Validate required fields
                    required_fields = ['summary', 'start', 'end']
                    missing_fields = [field for field in required_fields if field not in event_details]
                    if missing_fields:
                        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

                    # Validate start and end have dateTime
                    if 'dateTime' not in event_details['start'] or 'dateTime' not in event_details['end']:
                        raise ValueError("Start and end must include dateTime")

                    # Ensure timeZone is present
                    event_details['start']['timeZone'] = 'America/Los_Angeles'
                    event_details['end']['timeZone'] = 'America/Los_Angeles'

                    # Ensure reminders are set
                    if 'reminders' not in event_details:
                        event_details['reminders'] = {'useDefault': True}

                    # Process attendees if email is in the query
                    if 'attendees' not in event_details:
                        event_details['attendees'] = []
                        import re
                        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', action_query)
                        for email in emails:
                            event_details['attendees'].append({'email': email})

                    return event_details

                except json.JSONDecodeError as e:
                    return {
                        'status': 'error',
                        'message': f'Invalid JSON response from LLM: {str(e)}',
                        'raw_response': llm_response
                    }
                except ValueError as e:
                    return {
                        'status': 'error',
                        'message': str(e),
                        'raw_response': llm_response
                    }
            
            elif intent.intent == "DELETE":
                return {"action": "delete", "query": action_query}
            
            else:
                return {"error": "Unknown intent"}
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Failed to process request: {str(e)}',
                'traceback': str(e.__traceback__)
            }

    @staticmethod
    def get_groq_response(prompt):
        try:
            from groq import Groq
            import os
            from dotenv import load_dotenv
            
            load_dotenv()
            groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
            
            completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": """You are a precise calendar assistant that ONLY states facts directly from event information.
                        - IMPORTANT: If the event is recurring, include ONLY that and the times it recurs in the response
                        - Never make assumptions about events
                        - Only use explicitly stated information
                        - Use exact dates and times
                        - Keep responses under 20 words
                        - If information isn't in the event details, say so"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama3-70b-8192",
                temperature=0.1  # Add low temperature for more precise responses
            )
            
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Error getting Groq response: {str(e)}")
            return "I couldn't find that information in the calendar."

class EditOrDeleteIntentAgent:
    class Intents(BaseModel):
        intent: str

        @classmethod
        def model_validator(cls, values):
            if values.intent not in ["EDIT", "DELETE", "UNKNOWN"]:
                raise ValueError("Intent must be either EDIT, DELETE, or UNKNOWN")
            return values

    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.system_prompt = """You are a specialized intent classifier for calendar event modifications. Your task is to analyze user requests about EXISTING calendar events and classify them as either EDIT or DELETE. You must output EXACTLY one of these two words.

        Guidelines for classification:
        
        DELETE - Use when the user wants to:
        - Remove or cancel an event entirely
        - Clear a time slot
        - Get rid of a meeting or appointment
        - No longer attend an event
        
        Key DELETE indicators:
        - "cancel", "remove", "delete", "clear"
        - "don't want to go anymore"
        - "take off my calendar"
        - "not attending"
        
        EDIT - Use when the user wants to:
        - Change any aspect of an existing event
        - Modify time, date, location, or attendees
        - Update event details or description
        - Add or remove specific attendees
        - Change the duration
        
        Key EDIT indicators:
        - "change", "move", "update", "modify"
        - "reschedule", "shift", "push"
        - "make it longer/shorter"
        - "add person to", "remove person from"
        - "switch location"
        
        Examples:
        "Cancel my meeting with John" → DELETE
        "Remove tomorrow's dentist appointment" → DELETE
        "I can't make it to the team sync" → DELETE
        "Delete the lunch meeting" → DELETE
        "Clear my calendar for Friday" → DELETE
        
        "Move my 2pm call to 4pm" → EDIT
        "Change the location of tonight's dinner" → EDIT
        "Add Sarah to the project review" → EDIT
        "Make the meeting 30 minutes longer" → EDIT
        "Update the zoom link for the standup" → EDIT
        "Push back the doctor's appointment by 1 hour" → EDIT
        "Change this to a virtual meeting" → EDIT
        
        Remember: You must output EXACTLY either EDIT, DELETE, or UNKNOWN.
        If you cannot determine the intent, output UNKNOWN."""

    def extract_intent(self, query):
        chat_completion = self.groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": self.system_prompt
                },
                {
                    "role": "user",
                    "content": query,
                }
            ],
            model="llama3-8b-8192",
        )
        response = chat_completion.choices[0].message.content
        return self.Intents(intent=response)

# Update the test code
if __name__ == "__main__":
    try:
        SCOPES = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/contacts.readonly',
            'https://www.googleapis.com/auth/directory.readonly',
            'https://www.googleapis.com/auth/contacts.other.readonly',
            'https://www.googleapis.com/auth/peopleapi.readonly'
        ]
        # flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
        # creds = flow.run_local_server(port=8080)
        # service = build('calendar', 'v3', credentials=creds)
        # people_service = build('people', 'v1', credentials=creds)

        # contact_agent = ContactAgent(people_service)
        # result = contact_agent.email_lookup("connor")
        # print(result)

        # scheduling_agent = SchedulingAgent(service, people_service)
        
        # Get the event details first
        # event_details = scheduling_agent.process_request(
        #     "Schedule lunch with Connor Chan next Wednesday at noon", 
        #     ["I only take lunch meetings between 12-2pm", "No meetings on Fridays"]
        # )
        
        # print("Processed event details:", event_details)
        
        # Check for errors in the event details
        # if isinstance(event_details, dict) and event_details.get('status') == 'error':
        #     print("Error in processing request:", event_details['message'])
        #     if 'raw_response' in event_details:
        #         print("Raw LLM response:", event_details['raw_response'])
        # else:
            # Create the calendar event only if we have valid event details
    #         response = scheduling_agent.create_calendar_event(event_details)
    #         print("Create calendar event response:", response)
        
    except Exception as e:
        print(f"Error in main execution: {str(e)}")