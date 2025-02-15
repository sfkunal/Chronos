from flask import Flask, jsonify, session, redirect, request
from flask_cors import CORS
import os
import pathlib
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from pip._vendor import cachecontrol
import google.auth.transport.requests
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)


app.secret_key = 'thisisSECRET1340iu5203u5103'
CLIENT_SECRETS_FILE = "client_secret.json"
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # REMOVE IN PROD


@app.route('/', methods=['GET'])
def hello_world():
    try:
        return jsonify({'message': 'Welcome to Chronos API'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login')
def login():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri="http://127.0.0.1:5000/callback"
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    
    session['state'] = state
    return redirect(authorization_url)


@app.route('/callback')
def callback():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=session['state'],
        redirect_uri="http://127.0.0.1:5000/callback"
    )
    
    authorization_response = request.url
    flow.fetch_token(authorization_response=authorization_response)
    credentials = flow.credentials

    ten_days_ago = datetime.utcnow() - timedelta(days=10)
    time_min = ten_days_ago.isoformat() + 'Z'
    
    service = build('calendar', 'v3', credentials=credentials)
    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        maxResults=200,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    # print(events)
    
    return {'events': events}

@app.errorhandler(403)
def forbidden_error(error):
    return jsonify({
        "error": "Forbidden",
        "message": str(error)
    }), 403

@app.errorhandler(Exception)
def handle_error(error):
    return jsonify({
        "error": type(error).__name__,
        "message": str(error)
    }), 500

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True, port=5000)