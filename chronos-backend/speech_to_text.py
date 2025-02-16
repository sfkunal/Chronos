import wave
from time import time
from typing import Optional
import pyaudio
import os
import numpy as np
from io import BytesIO
from openai import OpenAI
from groq import Groq
from speech_config import (
    GROQ_API_KEY,
    OPENAI_API_KEY,
    FORMAT,
    CHANNELS,
    RATE,
    CHUNK,
    SILENCE_THRESHOLD,
    SILENCE_DURATION,
    PRE_SPEECH_BUFFER_DURATION
)


class SpeechToTextAssistant:
    def __init__(self):
        self.audio = pyaudio.PyAudio()
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))

    def process_audio_data(self, audio_data):
        """
        Process raw audio data and convert to proper format for Groq's Whisper model.
        Whisper expects:
        - 16-bit PCM WAV
        - Sample rate of 16000 Hz
        - Mono channel
        """
        try:
            # Convert to numpy array
            audio_np = np.frombuffer(audio_data, dtype=np.int16)
            
            # Ensure mono channel
            if CHANNELS == 2:
                audio_np = audio_np.reshape(-1, 2).mean(axis=1)
            
            # Create WAV file in memory
            audio_bytes = BytesIO()
            with wave.open(audio_bytes, 'wb') as wf:
                wf.setnchannels(1)  # Mono
                wf.setsampwidth(2)  # 16-bit
                wf.setframerate(16000)  # 16kHz
                wf.writeframes(audio_np.tobytes())
            
            audio_bytes.seek(0)
            return audio_bytes
            
        except Exception as e:
            print(f"Error processing audio data: {e}")
            return None

    def speech_to_text_g(self, audio_bytes):
        """
        Transcribe speech to text using Groq.
        """
        if audio_bytes is None:
            print("No audio data to transcribe")
            return None
            
        try:
            print("Sending audio to Groq for transcription...")
            audio_bytes.seek(0)
            
            # Debug: Print audio file size
            audio_size = len(audio_bytes.read())
            audio_bytes.seek(0)
            print(f"Audio file size: {audio_size} bytes")
            
            transcription = self.groq_client.audio.transcriptions.create(
                file=("audio.wav", audio_bytes.read()),
                model="distil-whisper-large-v3-en",
            )
            
            print(f"Received transcription: {transcription.text}")
            return transcription.text
            
        except Exception as e:
            print(f"Error in Groq transcription: {str(e)}")
            return None