import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { Line } from "react-chartjs-2";
import "./App.css";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

// =====================================================
// CONFIG
// =====================================================

const API = "http://localhost:5000";

const socket = io(API, {
  transports: ["websocket", "polling"],
  reconnection: true,
});

// =====================================================
// ICONS
// =====================================================

const icons = {
  overview: "◈",
  monitoring: "◉",
  analytics: "▥",
  history: "▤",
  alerts: "⚠",
  system: "⚙",
};

// =====================================================
// PARTICLE BACKGROUND
// =====================================================

function ParticlesBg() {
  return (
    <div className="particles">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({ icon, title, value, subtitle, accent = "cyan" }) {
  return (
    <div className={`stat-card ${accent}`}>
      <div className="stat-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-live">LIVE</span>
      </div>

      <div className="stat-title">{title}</div>

      <div className="stat-value">{value}</div>

      <div className="stat-subtitle">{subtitle}</div>
    </div>
  );
}

// =====================================================
// SIDEBAR
// =====================================================

function Sidebar({ active, setActive }) {
  const items = [
    ["overview", "Overview"],
    ["monitoring", "Live Monitoring"],
    ["analytics", "Analytics"],
    ["history", "History"],
    ["alerts", "Alerts"],
    ["system", "System"],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">◈</div>

        <div>
          <div className="brand-name">SMART WASTE</div>
          <div className="brand-sub">INTELLIGENCE PLATFORM</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">CONTROL CENTER</div>

        {items.map(([key, label]) => (
          <button
            key={key}
            className={`nav-button ${active === key ? "active" : ""}`}
            onClick={() => setActive(key)}
          >
            <span>{icons[key]}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="connection-mini">
          <span className="online-dot" />
          <div>
            <strong>SYSTEM ONLINE</strong>
            <small>Arduino-ready architecture</small>
          </div>
        </div>

        <div className="version">SMART WASTE v2.0</div>
      </div>
    </aside>
  );
}

// =====================================================
// HEADER
// =====================================================

function Header({ socketOnline }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      <div>
        <div className="page-kicker">WASTE OPERATIONS CENTER</div>
        <h1>Smart Waste Intelligence</h1>
      </div>

      <div className="topbar-right">
        <div className="clock">
          <strong>
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </strong>
          <small>
            {time.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </small>
        </div>

        <div className={`connection ${socketOnline ? "online" : "offline"}`}>
          <span />
          {socketOnline ? "SYSTEM ONLINE" : "RECONNECTING"}
        </div>
      </div>
    </header>
  );
}

// =====================================================
// BIN VISUALIZATION
// =====================================================

function SmartBin({ fill }) {
  let levelClass = "normal";

  if (fill >= 85) levelClass = "critical";
  else if (fill >= 60) levelClass = "warning";

  return (
    <div className="bin-panel">
      <div className="panel-header">
        <div>
          <span className="section-label">LIVE HARDWARE</span>
          <h2>Smart Bin</h2>
        </div>

        <div className={`status-pill ${levelClass}`}>
          {levelClass === "normal" && "● NORMAL"}
          {levelClass === "warning" && "● WARNING"}
          {levelClass === "critical" && "● CRITICAL"}
        </div>
      </div>

      <div className="bin-stage">
        <div className="bin-shadow" />

        <div className="bin">
          <div className="bin-lid">
            <div />
          </div>

          <div className="bin-body">
            <div
              className={`waste-level ${levelClass}`}
              style={{ height: `${Math.max(fill, 3)}%` }}
            >
              <div className="waste-wave" />
            </div>

            <div className="bin-percent">{Math.round(fill)}%</div>
          </div>
        </div>

        <div className="bin-side-data">
          <div>
            <span>CAPACITY</span>
            <strong>{Math.round(fill)}%</strong>
          </div>

          <div>
            <span>AVAILABLE</span>
            <strong>{Math.max(0, Math.round(100 - fill))}%</strong>
          </div>

          <div>
            <span>SENSOR</span>
            <strong>ACTIVE</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CHART
// =====================================================

function FillChart({ data }) {
  const chartData = useMemo(
    () => ({
      labels: data.map((item) => item.time || "").slice(-30),

      datasets: [
        {
          label: "Fill Level",
          data: data.map((item) => item.level || 0).slice(-30),
          borderColor: "#35e6ff",
          backgroundColor: "rgba(53,230,255,0.08)",
          borderWidth: 3,
          pointRadius: 2,
          pointHoverRadius: 6,
          tension: 0.42,
          fill: true,
        },
      ],
    }),
    [data]
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      intersect: false,
      mode: "index",
    },

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        backgroundColor: "#101827",
        borderColor: "#263852",
        borderWidth: 1,
        padding: 12,

        callbacks: {
          label: (context) => ` Fill: ${context.raw}%`,
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },

        ticks: {
          color: "#70839d",
          maxTicksLimit: 8,
        },
      },

      y: {
        min: 0,
        max: 100,

        grid: {
          color: "rgba(120,150,180,0.08)",
        },

        ticks: {
          color: "#70839d",
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="chart-panel">
      <div className="panel-header">
        <div>
          <span className="section-label">REAL-TIME ANALYTICS</span>
          <h2>Capacity Trend</h2>
        </div>

        <div className="chart-legend">
          <span />
          Fill Level
        </div>
      </div>

      <div className="chart-wrapper">
        {data.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="empty-chart">
            Waiting for sensor data...
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// ALERT PANEL
// =====================================================

function AlertPanel({ fill }) {
  let type = "normal";
  let title = "System operating normally";
  let message = "Current capacity is within the safe operating range.";

  if (fill >= 85) {
    type = "critical";
    title = "Critical capacity reached";
    message = "Collection is recommended immediately.";
  } else if (fill >= 60) {
    type = "warning";
    title = "Bin approaching capacity";
    message = "Monitor the waste level and prepare for collection.";
  }

  return (
    <div className={`alert-panel ${type}`}>
      <div className="alert-icon">
        {type === "normal" && "✓"}
        {type === "warning" && "!"}
        {type === "critical" && "⚠"}
      </div>

      <div>
        <div className="alert-label">
          {type.toUpperCase()} ALERT
        </div>

        <h3>{title}</h3>

        <p>{message}</p>
      </div>
    </div>
  );
}

// =====================================================
// ACTIVITY
// =====================================================

function ActivityPanel({ data }) {
  const recent = [...data].slice(-5).reverse();

  return (
    <div className="activity-panel">
      <div className="panel-header">
        <div>
          <span className="section-label">EVENT STREAM</span>
          <h2>Recent Activity</h2>
        </div>

        <span className="stream-dot">● LIVE</span>
      </div>

      <div className="activity-list">
        {recent.length === 0 ? (
          <div className="empty-state">
            No events received yet.
          </div>
        ) : (
          recent.map((item, index) => (
            <div className="activity-item" key={index}>
              <div className="activity-dot" />

              <div>
                <strong>Sensor reading received</strong>
                <small>
                  {item.time || "LIVE"} • Fill level {item.level || 0}%
                </small>
              </div>

              <span className="activity-value">
                {item.level || 0}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =====================================================
// ANALYTICS PAGE
// =====================================================

function AnalyticsPage({ data, analytics, prediction }) {
  const latest = data[data.length - 1] || {};
  const fill = latest.level || 0;

  return (
    <div className="page-content">
      <div className="section-title">
        <span>INTELLIGENCE</span>
        <h2>Analytics & Forecasting</h2>
        <p>
          Historical trends and predictive capacity analysis.
        </p>
      </div>

      <div className="analytics-grid">
        <StatCard
          icon="∿"
          title="Average Fill"
          value={`${analytics.averageFill?.toFixed(1) || 0}%`}
          subtitle="Historical average"
          accent="cyan"
        />

        <StatCard
          icon="↗"
          title="Current Level"
          value={`${fill}%`}
          subtitle="Latest sensor reading"
          accent="purple"
        />

        <StatCard
          icon="◷"
          title="Prediction"
          value={prediction.trend || "Pending"}
          subtitle="AI trend analysis"
          accent="yellow"
        />
      </div>

      <div className="large-chart">
        <FillChart data={data} />
      </div>
    </div>
  );
}

// =====================================================
// HISTORY PAGE
// =====================================================

function HistoryPage({ data }) {
  return (
    <div className="page-content">
      <div className="section-title">
        <span>DATABASE</span>
        <h2>Waste History</h2>
        <p>Recent sensor observations received from the system.</p>
      </div>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>TIME</th>
              <th>FILL LEVEL</th>
              <th>STATUS</th>
              <th>SOURCE</th>
            </tr>
          </thead>

          <tbody>
            {[...data].reverse().slice(0, 20).map((item, index) => {
              const level = item.level || 0;

              return (
                <tr key={index}>
                  <td>{item.time || "--"}</td>

                  <td>
                    <div className="table-progress">
                      <div
                        style={{
                          width: `${level}%`,
                        }}
                      />
                    </div>

                    {level}%
                  </td>

                  <td>
                    <span
                      className={`table-status ${
                        level >= 85
                          ? "critical"
                          : level >= 60
                          ? "warning"
                          : "normal"
                      }`}
                    >
                      {level >= 85
                        ? "CRITICAL"
                        : level >= 60
                        ? "WARNING"
                        : "NORMAL"}
                    </span>
                  </td>

                  <td>LIVE SENSOR</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================
// SYSTEM PAGE
// =====================================================

function SystemPage({ socketOnline }) {
  const systems = [
    ["React Dashboard", "ONLINE"],
    ["Node.js Backend", "ONLINE"],
    ["MongoDB", "CONNECTED"],
    ["Socket.IO", socketOnline ? "CONNECTED" : "RECONNECTING"],
    ["Analytics Engine", "ACTIVE"],
    ["Prediction Engine", "ACTIVE"],
    ["Arduino Interface", "READY"],
  ];

  return (
    <div className="page-content">
      <div className="section-title">
        <span>DIAGNOSTICS</span>
        <h2>System Health</h2>
        <p>Live status of the Smart Dustbin software stack.</p>
      </div>

      <div className="system-panel">
        {systems.map(([name, status]) => (
          <div className="system-row" key={name}>
            <div>
              <strong>{name}</strong>
              <small>Service component</small>
            </div>

            <span
              className={
                status === "ONLINE" ||
                status === "CONNECTED" ||
                status === "ACTIVE" ||
                status === "READY"
                  ? "system-online"
                  : "system-warning"
              }
            >
              ● {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// MAIN APPLICATION
// =====================================================

export default function App() {
  const [data, setData] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [prediction, setPrediction] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketOnline, setSocketOnline] = useState(false);
  const [activePage, setActivePage] = useState("overview");

  // ===================================================
  // INITIAL DATA
  // ===================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [d1, d2, d3] = await Promise.all([
          axios.get(`${API}/data`),
          axios.get(`${API}/analytics`),
          axios.get(`${API}/prediction`),
        ]);

        setData(d1.data || []);
        setAnalytics(d2.data || {});
        setPrediction(d3.data || {});
        setError(null);
      } catch (err) {
        console.error("Backend error:", err);

        setError(
          "Backend connection failed. Please check localhost:5000."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ===================================================
  // SOCKET.IO
  // ===================================================

  useEffect(() => {
    const onConnect = () => {
      console.log("SOCKET CONNECTED ✅", socket.id);
      setSocketOnline(true);
    };

    const onDisconnect = () => {
      console.log("SOCKET DISCONNECTED");
      setSocketOnline(false);
    };

    const onError = (err) => {
      console.log("SOCKET ERROR ❌", err.message);
      setSocketOnline(false);
    };

    const onNewData = (entry) => {
      console.log("NEW SENSOR DATA:", entry);

      setData((prev) => {
        const updated = [...prev, entry];

        return updated.slice(-100);
      });

      setError(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    socket.on("newData", onNewData);

    if (socket.connected) {
      setSocketOnline(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off("newData", onNewData);
    };
  }, []);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-ring" />
        <h2>SMART WASTE</h2>
        <p>Initializing intelligence platform...</p>
      </div>
    );
  }

  // ===================================================
  // CURRENT VALUES
  // ===================================================

  const latest = data[data.length - 1] || {};

  const fill = Number(latest.level || 0);

  const items = Math.max(
    0,
    Math.floor((fill / 100) * 40)
  );

  let status = "NORMAL";

  if (fill >= 85) {
    status = "CRITICAL";
  } else if (fill >= 60) {
    status = "WARNING";
  }

  // ===================================================
  // PAGE CONTENT
  // ===================================================

  const renderPage = () => {
    if (activePage === "analytics") {
      return (
        <AnalyticsPage
          data={data}
          analytics={analytics}
          prediction={prediction}
        />
      );
    }

    if (activePage === "history") {
      return <HistoryPage data={data} />;
    }

    if (activePage === "system") {
      return <SystemPage socketOnline={socketOnline} />;
    }

    if (activePage === "alerts") {
      return (
        <div className="page-content">
          <div className="section-title">
            <span>SECURITY & ALERTS</span>
            <h2>Alert Center</h2>
            <p>Automated capacity monitoring.</p>
          </div>

          <AlertPanel fill={fill} />

          <div className="alert-history">
            <div className="alert-history-title">
              ALERT THRESHOLDS
            </div>

            <div className="threshold">
              <span>Normal operating range</span>
              <strong>0–59%</strong>
            </div>

            <div className="threshold">
              <span>Warning threshold</span>
              <strong>60%</strong>
            </div>

            <div className="threshold">
              <span>Critical threshold</span>
              <strong>85%</strong>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="hero-title">
          <div>
            <span>REAL-TIME MONITORING</span>
            <h2>Operations Overview</h2>
            <p>
              Intelligent waste monitoring and predictive capacity management.
            </p>
          </div>

          <div className="hero-status">
            <span className="pulse" />
            LIVE DATA STREAM
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            icon="◉"
            title="Fill Level"
            value={`${fill}%`}
            subtitle="Current capacity"
            accent="cyan"
          />

          <StatCard
            icon="♙"
            title="Waste Events"
            value={items}
            subtitle="Estimated deposits"
            accent="purple"
          />

          <StatCard
            icon="⚡"
            title="System Status"
            value={status}
            subtitle="Automated assessment"
            accent={
              status === "CRITICAL"
                ? "red"
                : status === "WARNING"
                ? "yellow"
                : "green"
            }
          />

          <StatCard
            icon="◷"
            title="AI Prediction"
            value={prediction.trend || "ACTIVE"}
            subtitle="Capacity forecast"
            accent="yellow"
          />
        </div>

        <div className="main-grid">
          <FillChart data={data} />
          <SmartBin fill={fill} />
        </div>

        <div className="bottom-grid">
          <AlertPanel fill={fill} />
          <ActivityPanel data={data} />
        </div>
      </>
    );
  };

  // ===================================================
  // RETURN
  // ===================================================

  return (
    <div className="app">
      <ParticlesBg />

      <div className="app-layout">
        <Sidebar
          active={activePage}
          setActive={setActivePage}
        />

        <main className="main">
          <Header socketOnline={socketOnline} />

          {error && (
            <div className="connection-warning">
              <span>⚠</span>

              <div>
                <strong>Backend connection warning</strong>
                <small>{error}</small>
              </div>
            </div>
          )}

          {renderPage()}
        </main>
      </div>
    </div>
  );
}