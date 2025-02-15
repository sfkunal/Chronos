from groq import Groq
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import datetime, timedelta
import pytz

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

class SchedulingAgent:
    def __init__(self, service):
        self.intent_agent = IntentAgent()
        self.availability_agent = AvailabilityAgent(service)
        self.preferences_agent = PreferencesAgent()
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
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
        5. Extract attendee emails if present
        6. Extract location if present
        7. Always set reminders.useDefault to true
        8. ABOVE ALL, RESPECT THE AVAILABILITY PREFERENCES THAT A USER PROVIDES YOU""".format(current_date, current_time)

    def process_request(self, action_query: str, preferences: list[str]):
        intent = self.intent_agent.extract_intent(action_query)
        preference_rules = self.preferences_agent.get_rule_based_preferences(preferences)
        
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
                        
                        Generate a calendar event JSON that respects these preferences and availability."""
                    }
                ],
                model="llama3-70b-8192",
            )
            
            return chat_completion.choices[0].message.content
        
        elif intent.intent == "DELETE":
            # For delete operations, we'll need to implement search functionality
            # to find the specific event to delete
            return {"action": "delete", "query": action_query}
        
        else:
            return {"error": "Unknown intent"}

# intent_agent = IntentAgent()

# for i in range(10):
#     print(intent_agent.extract_intent(sample_action_query))

from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']
flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
creds = flow.run_local_server(port=8080)
service = build('calendar', 'v3', credentials=creds)

# availability = AvailabilityAgent(service)
# availability = scheduling_agent.get_two_week_availability()
# print(availability)

# preferences_agent = PreferencesAgent()
# rules = preferences_agent.get_rule_based_preferences(sample_preferences)
# print(rules)

scheduling_agent = SchedulingAgent(service)  # service is your Google Calendar service
result = scheduling_agent.process_request(
    "Schedule lunch with Connor next Wednesday at noon", 
    ["I only take lunch meetings between 12-2pm", "No meetings on Fridays"]
)

print(result)