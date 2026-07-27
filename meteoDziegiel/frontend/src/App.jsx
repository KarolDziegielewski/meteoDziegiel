import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import './App.css'; // Zakładam podstawowe style

// ZMIEŃ TO NA ADRES IP SWOJEGO VPS-a!
// Przeglądarka (klient) musi wiedzieć, gdzie fizycznie wysyłać zapytania
const API_URL = 'http://51.68.143.200:5000/api';

function App() {
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Pobieramy dane równolegle
      const [latestRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/latest`),
        axios.get(`${API_URL}/history?hours=24`)
      ]);

      setLatestData(latestRes.data);
      
      // Formatujemy datę dla wykresu, żeby była czytelniejsza (tylko godzina i minuta)
      const formattedHistory = historyRes.data.map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      
      setHistoryData(formattedHistory);
      setLoading(false);
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
    }
  };

  // Pobierz dane przy starcie i odświeżaj co 30 sekund
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading">Ładowanie danych ze stacji...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Stacja Meteorologiczna ESP8266</h1>
      
      {/* KAFELKI Z AKTUALNYMI DANYMI */}
      <div className="cards-grid">
        <div className="card temp-card">
          <Thermometer size={32} />
          <div className="card-info">
            <h3>Temperatura</h3>
            <p className="value">{latestData?.temperature}°C</p>
          </div>
        </div>
        
        <div className="card hum-card">
          <Droplets size={32} />
          <div className="card-info">
            <h3>Wilgotność</h3>
            <p className="value">{latestData?.humidity}%</p>
          </div>
        </div>
        
        <div className="card air-card">
          <Wind size={32} />
          <div className="card-info">
            <h3>Jakość powietrza (MQ-135)</h3>
            <p className="value">{latestData?.air_quality} <span>j. umownych</span></p>
          </div>
        </div>
      </div>

      {/* WYKRES HISTORYCZNY */}
      <div className="chart-container">
        <h2>Historia - ostatnie 24h</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff7300" name="Temp (°C)" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#387908" name="Wilgotność (%)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="air_quality" stroke="#8884d8" name="Powietrze (j.u.)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
