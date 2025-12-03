import { useEffect, useState } from 'react';

interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

function WeatherForecast() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5289/weatherforecast')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        return response.json();
      })
      .then(data => {
        setForecasts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading weather data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ margin: '20px' }}>
      <h2>Weather Forecast from API</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #676bc1ff' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Temp (°C)</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Temp (°F)</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Summary</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((forecast, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #535bf2' }}>
              <td style={{ padding: '10px' }}>{forecast.date}</td>
              <td style={{ padding: '10px' }}>{forecast.temperatureC}</td>
              <td style={{ padding: '10px' }}>{forecast.temperatureF}</td>
              <td style={{ padding: '10px' }}>{forecast.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WeatherForecast;
