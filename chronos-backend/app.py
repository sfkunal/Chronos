from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello_world():
    return {'message': 'Welcome to Chronos API'}

if __name__ == '__main__':
    app.run(debug=True)