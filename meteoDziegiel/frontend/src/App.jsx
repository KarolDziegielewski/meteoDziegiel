import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import './App.css';

// Upewnij się, że tu jest poprawne IP serwera!
const API_URL = 'http://51.68.143.200:5000/api';

// Funkcja tłumacząca surowe wartości MQ-135
const getAirQualityStatus = (value) => {
  if (value == null) return { text: "Brak danych", color: "#9ca3af" };
  if (value <= 300) return { text: "Bardzo dobra", color: "#22c55e" }; // Zielony
  if (value <= 500) return { text: "Przeciętna", color: "#eab308" };   // Żółty
  if (value <= 800) return { text: "Słaba (Zaduch)", color: "#f97316" };// Pomarańczowy
  return { text: "Zła (Dym/Gazy)", color: "#ef4444" };                 // Czerwony
};

function App() {
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // domyślnie 24 godziny

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          axios.get(`${API_URL}/latest`),
          axios.get(`${API_URL}/history?hours=${timeRange}`)
        ]);

        setLatestData(latestRes.data);
        
        // Dopasowanie wyświetlania daty zależnie od skali czasu
        const formattedHistory = historyRes.data.map(item => {
         // Zamieniamy spację na 'T' i dodajemy 'Z' na końcu (standard ISO 8601 dla UTC)
const date = new Date(item.timestamp.replace(" ", "T") + "Z");
          const timeFormat = timeRange === 24 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Np. "14:30"
            : date.toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); // Np. "15.08 14:30"
          
          return { ...item, time: timeFormat };
        });
        
        setHistoryData(formattedHistory);
        setLoading(false);
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      }
    };

    setLoading(true);
    fetchData();
    // Odświeżanie co minutę
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [timeRange]); // Przeładowuje dane przy każdej zmianie przycisku

  if (loading && !latestData) {
    return <div className="loading">Ładowanie danych ze stacji...</div>;
  }

  const airStatus = getAirQualityStatus(latestData?.air_quality);

  return (
    <div className="dashboard-container">
      <h1>Stacja MeteoDzięgiel</h1>
      
      {/* KAFELKI Z AKTUALNYMI DANYMI */}
      <div className="cards-grid">
        <div className="card">
          <Thermometer size={32} color="#ff7300" />
          <div className="card-info">
            <h3>Temperatura</h3>
            <p className="value">{latestData?.temperature}°C</p>
          </div>
        </div>
        
        <div className="card">
          <Droplets size={32} color="#387908" />
          <div className="card-info">
            <h3>Wilgotność</h3>
            <p className="value">{latestData?.humidity}%</p>
          </div>
        </div>
        
        <div className="card" style={{ borderBottom: `4px solid ${airStatus.color}` }}>
          <Wind size={32} color={airStatus.color} />
          <div className="card-info">
            <h3>Jakość powietrza</h3>
            <p className="value">{latestData?.air_quality} <span style={{color: '#666'}}>({airStatus.text})</span></p>
          </div>
        </div>
      </div>

      {/* PRZYCISKI ZAKRESU CZASU */}
      <div className="controls">
        <button className={timeRange === 24 ? 'active' : ''} onClick={() => setTimeRange(24)}>Ostatnie 24h</button>
        <button className={timeRange === 168 ? 'active' : ''} onClick={() => setTimeRange(168)}>Ostatnie 7 dni</button>
        <button className={timeRange === 720 ? 'active' : ''} onClick={() => setTimeRange(720)}>Ostatnie 30 dni</button>
      </div>

      {/* TRZY ODDZIELNE WYKRESY */}
      <div className="charts-column">
        
        <div className="chart-box">
          <h2>Temperatura (°C)</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fontSize: 12}} minTickGap={30} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#ff7300" name="Temp (°C)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box">
          <h2>Wilgotność (%)</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fontSize: 12}} minTickGap={30} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="humidity" stroke="#387908" name="Wilgotność (%)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box">
          <h2>Jakość Powietrza</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={historyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{fontSize: 12}} minTickGap={30} />
                <YAxis domain={[0, 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="air_quality" stroke="#8884d8" name="Powietrze (j.u.)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;