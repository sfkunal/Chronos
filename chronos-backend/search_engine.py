import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from datetime import datetime
import dotenv
import uuid
import os
import logging

logging.basicConfig(level=logging.INFO)

dotenv.load_dotenv()

# Use SentenceTransformer for better embeddings
embedder = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

client = chromadb.HttpClient(
    ssl=True,
    host='api.trychroma.com',
    tenant='eeeaf9e6-bf44-43c7-9409-46d930556a39',
    database='Chronos',
    headers={
        'x-chroma-token': os.getenv('CHROMA_API_KEY')
    }
)

# Create or get the collection with the embedding function
collection = client.get_or_create_collection(
    name="calendar_events",
    metadata={"hnsw:space": "l2"},
    embedding_function=embedder
)

def stringify_event(event):
    parts = []
    if 'summary' in event:
        parts.append(f"Event '{event['summary']}'")
    else:
        parts.append("Untitled event")
    
    if 'start' in event:
        start_time = event['start'].get('dateTime', event['start'].get('date'))
        if start_time:
            if 'T' in start_time:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                start_str = start_dt.strftime("%B %d, %Y at %I:%M %p")
            else:
                start_str = datetime.fromisoformat(start_time).strftime("%B %d, %Y")
            parts.append(f"starts on {start_str}")
    
    if 'end' in event:
        end_time = event['end'].get('dateTime', event['end'].get('date'))
        if end_time:
            if 'T' in end_time:
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                end_str = end_dt.strftime("%I:%M %p")
                parts.append(f"ends at {end_str}")
            else:
                end_str = datetime.fromisoformat(end_time).strftime("%B %d, %Y")
                parts.append(f"ends on {end_str}")
    
    if 'attendees' in event:
        attendee_emails = [attendee['displayName'] if 'displayName' in attendee else attendee['email'] for attendee in event['attendees']]
        if len(attendee_emails) > 0:
            parts.append(f"with attendees {', '.join(attendee_emails)}")
    
    if 'description' in event and event['description']:
        parts.append(f"with description: {event['description']}")
    
    return ' '.join(parts) + ". "

def update_events_in_chroma(events):
    try:
        # Get all existing IDs first
        existing = collection.get()
        if existing and existing['ids']:
            collection.delete(ids=existing['ids'])
            logging.info(f"Cleared {len(existing['ids'])} existing events from collection")

        # Process events in smaller chunks
        CHUNK_SIZE = 10  # Process 10 events per document
        documents = []
        metadatas = []
        ids = []
        
        for i in range(0, len(events), CHUNK_SIZE):
            chunk = events[i:i + CHUNK_SIZE]
            chunk_text = ""
            
            for event in chunk:
                try:
                    event_text = stringify_event(event)
                    chunk_text += event_text + " "
                except Exception as e:
                    logging.error(f"Error processing event: {str(e)}")
                    continue
            
            if chunk_text:
                chunk_id = f"chunk_{i//CHUNK_SIZE}"
                documents.append(chunk_text)
                metadatas.append({
                    "idx": i//CHUNK_SIZE,  # shorter key name
                    "size": len(chunk),    # shorter key name
                    "ts": datetime.now().strftime("%Y%m%d")  # compact date format
                })
                ids.append(chunk_id)

        # Add chunks to collection
        if documents:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            logging.info(f"Added {len(documents)} chunks containing {len(events)} events to collection")

        return True

    except Exception as e:
        logging.error(f"Error in update_events_in_chroma: {str(e)}")
        return False

def search_events(query_text, n_results=5):
    try:
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results
    except Exception as e:
        logging.error(f"Error in search_events: {str(e)}")
        return None

# if __name__ == '__main__':
#     test_event = {
#         "attendees": [
#             {
#                 "displayName": "carsus🧐",
#                 "email": "haverdac@gmail.com",
#                 "responseStatus": "needsAction"
#             },
#             {
#                 "email": "olliecrank@gmail.com",
#                 "responseStatus": "needsAction"
#             },
#             {
#                 "email": "kunalsr@uw.edu",
#                 "organizer": True,
#                 "responseStatus": "accepted",
#                 "self": True
#             },
#             {
#                 "displayName": "Connor Chan",
#                 "email": "connorchansf@gmail.com",
#                 "responseStatus": "needsAction"
#             },
#             {
#                 "displayName": "Bob Watson",
#                 "email": "rdwatson02@gmail.com",
#                 "responseStatus": "accepted"
#             },
#             {
#                 "email": "aidanhong123@gmail.com",
#                 "responseStatus": "needsAction"
#             },
#             {
#                 "email": "nelsonm1@uw.edu",
#                 "responseStatus": "needsAction"
#             },
#             {
#                 "email": "sarveshbala03@gmail.com",
#                 "responseStatus": "needsAction"
#             }
#         ],
#         "colorId": "6",
#         "created": "2025-01-01T06:18:33.000Z",
#         "creator": {
#             "email": "kunalsr@uw.edu",
#             "self": True
#         },
#         "end": {
#             "dateTime": "2025-02-08T12:00:00-08:00",
#             "timeZone": "America/Los_Angeles"
#         },
#         "etag": "\"3478076805034000\"",
#         "eventType": "default",
#         "guestsCanModify": True,
#         "htmlLink": "https://www.google.com/calendar/event?eid=MWQzMzkzZDhiMmYwNGI1Mzk1MWMxZGFlZTRmNjBkMjFfMjAyNTAyMDhUMTkwMDAwWiBrdW5hbHNyQHV3LmVkdQ",
#         "iCalUID": "1d3393d8b2f04b53951c1daee4f60d21@google.com",
#         "id": "1d3393d8b2f04b53951c1daee4f60d21_20250208T190000Z",
#         "kind": "calendar#event",
#         "location": "University of Washington Golf Range, 2800 NE Clark Rd, Seattle, WA 98195, USA",
#         "organizer": {
#             "email": "kunalsr@uw.edu",
#             "self": True
#         },
#         "originalStartTime": {
#             "dateTime": "2025-02-08T11:00:00-08:00",
#             "timeZone": "America/Los_Angeles"
#         },
#         "recurringEventId": "1d3393d8b2f04b53951c1daee4f60d21",
#         "reminders": {
#             "useDefault": True
#         },
#         "sequence": 2,
#         "start": {
#             "dateTime": "2025-02-08T11:00:00-08:00",
#             "timeZone": "America/Los_Angeles"
#         },
#         "status": "confirmed",
#         "summary": "Weekly Golf",
#         "updated": "2025-02-08T18:13:22.517Z"
#     }
    
#     print(stringify_event(test_event))