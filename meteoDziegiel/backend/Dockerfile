FROM python:3.11-slim

WORKDIR /app

# Kopiujemy wymagania i instalujemy paczki
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy resztę kodu
COPY . .

# Tworzymy katalog na plik bazy SQLite
RUN mkdir -p data

EXPOSE 5000

# Uruchamiamy Gunicorna nasłuchującego na porcie 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]