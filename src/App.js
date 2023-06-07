import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { w3cwebsocket as WebSocketClient } from 'websocket';
import { Chart, registerables } from 'chart.js';
import { format, subMinutes } from 'date-fns';

Chart.register(...registerables);

function App() {
  const [bitcoinData, setBitcoinData] = useState([]);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    const ws = new WebSocketClient('ws://localhost:8000');
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      setBitcoinData((prevData) => [...prevData, data]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchBitcoinPrice = async () => {
    try {
      const response = await axios.get('/api/bitcoin');
      const data = response.data;
      setBitcoinData((prevData) => [...prevData, data]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBitcoinPrice();
  }, []);

  useEffect(() => {
    if (bitcoinData.length > 0) {
      const ctx = document.getElementById('chart').getContext('2d');
      const prices = bitcoinData.map((data) => data.price);
      const times = bitcoinData.map((data) => new Date(data.time).toLocaleTimeString());

      if (chart) {
        chart.data.labels = times;
        chart.data.datasets[0].data = prices;
        chart.update();
      } else {
        const newChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: times,
            datasets: [
              {
                label: 'Bitcoin Price',
                data: prices,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: {
                  parser: (value) => format(subMinutes(new Date(value), 1), 'h:mm a'),
                  unit: 'minute',
                  displayFormats: {
                    minute: 'h:mm a',
                  },
                },
                ticks: {
                  source: 'labels',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Price (USD)',
                },
              },
            },
          },


        });
        setChart(newChart);
      }
    }
  }, [bitcoinData]);

  return (
    <div>
      <h1>Bitcoin Price</h1>
      <canvas id="chart"></canvas>
    </div>
  );
}

export default App;
