import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from datetime import datetime
import dotenv
import uuid
import os
import logging

logging.basicConfig(level=logging.INFO)

dotenv.load_dotenv()

class SearchEngine:
    def __init__(self):
        self.client = None
        self.embedder = None
        self.collection = None
        self.initialize()

    def initialize(self):
        try:
            logging.info(f"Initializing ChromaDB version: {chromadb.__version__}")
            self.client = chromadb.HttpClient(
                ssl=True,
                host='api.trychroma.com',
                tenant='eeeaf9e6-bf44-43c7-9409-46d930556a39',
                database='Chronos',
                headers={
                    'x-chroma-token': os.getenv('CHROMA_API_KEY')
                }
            )
            
            # Test the connection and log server version
            heartbeat = self.client.heartbeat()
            logging.info(f"Connected to ChromaDB server. Heartbeat: {heartbeat}")
            
            self.embedder = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            self.collection = self.client.get_or_create_collection(
                name="calendar_events",
                embedding_function=self.embedder
            )
            logging.info("Successfully initialized ChromaDB connection")
        except Exception as e:
            logging.error(f"Failed to initialize ChromaDB: {str(e)}")
            raise

    def update_events_in_chroma(self, events):
        try:
            existing = self.collection.get()
            if existing and existing['ids']:
                self.collection.delete(ids=existing['ids'])
                logging.info(f"Cleared {len(existing['ids'])} existing events from collection")

            CHUNK_SIZE = 10
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
                        "idx": i//CHUNK_SIZE,
                        "size": len(chunk),
                        "ts": datetime.now().strftime("%Y%m%d")
                    })
                    ids.append(chunk_id)

            if documents:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                logging.info(f"Added {len(documents)} chunks containing {len(events)} events to collection")

            return True

        except Exception as e:
            logging.error(f"Error in update_events_in_chroma: {str(e)}")
            return False

    def search_events(self, query_text, n_results=5):
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results
            )
            return results
        except Exception as e:
            logging.error(f"Error in search_events: {str(e)}")
            return None

# Create a singleton instance
search_engine = SearchEngine()

# Export the methods to maintain backwards compatibility
def update_events_in_chroma(events):
    return search_engine.update_events_in_chroma(events)

def search_events(query_text, n_results=5):
    return search_engine.search_events(query_text, n_results)

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

    if 'recurrence' in event:
        parts.append(f" and recurs every {event['recurrence']}")
    
    return ' '.join(parts) + ". "
