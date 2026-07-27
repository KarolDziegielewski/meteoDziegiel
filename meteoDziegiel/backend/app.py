import os
import sqlite3
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Zezwala Reactowi na zapytania z innego portu/domeny

# Prosta autoryzacja – zmień ten ciąg na własny tajny klucz!
API_KEY = os.environ.get("API_KEY", "TwojTajnyKlucz123!")
DB_FILE = "data/meteo.db"

def init_db():
    """Tworzy strukturę bazy danych, jeśli jeszcze nie istnieje."""
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            air_quality INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Inicjalizacja bazy przy starcie aplikacji
init_db()

# --- ENDPOINT 1: Odbiór danych z ESP8266 ---
@app.route('/api/sensor', methods=['POST'])
def receive_sensor_data():
    # Weryfikacja klucza API z nagłówka HTTP
    client_key = request.headers.get('X-API-Key')
    if client_key != API_KEY:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    if not data or 'temperature' not in data or 'humidity' not in data or 'air_quality' not in data:
        return jsonify({"error": "Błędny format danych"}), 400

    temp = data['temperature']
    hum = data['humidity']
    air = data['air_quality']

    # Zapis do bazy danych
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO readings (temperature, humidity, air_quality)
        VALUES (?, ?, ?)
    ''', (temp, hum, air))
    conn.commit()
    conn.close()

    return jsonify({"status": "success"}), 201


# --- ENDPOINT 2: Najnowszy pomiar (dla kafelków w Reacie) ---
@app.route('/api/latest', methods=['GET'])
def get_latest_reading():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp, temperature, humidity, air_quality 
        FROM readings ORDER BY id DESC LIMIT 1
    ''')
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"message": "Brak danych"}), 404

    return jsonify({
        "timestamp": row[0],
        "temperature": row[1],
        "humidity": row[2],
        "air_quality": row[3]
    })


# --- ENDPOINT 3: Historia dla wykresów (domyślnie ostatnie 24h) ---
@app.route('/api/history', methods=['GET'])
def get_history():
    hours = request.args.get('hours', default=24, type=int)
    time_threshold = datetime.utcnow() - timedelta(hours=hours)

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp, temperature, humidity, air_quality 
        FROM readings 
        WHERE timestamp >= ? 
        ORDER BY timestamp ASC
    ''', (time_threshold.strftime('%Y-%m-%d %H:%M:%S'),))
    rows = cursor.fetchall()
    conn.close()

    history = [
        {
            "timestamp": row[0],
            "temperature": row[1],
            "humidity": row[2],
            "air_quality": row[3]
        } for row in rows
    ]

    return jsonify(history)

if __name__ == '__main__':
    # Serwer nasłuchuje na wszystkich interfejsach na porcie 5000
    app.run(host='0.0.0.0', port=5000)