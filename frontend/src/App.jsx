
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [wifi, setWifi] = useState(null);
  const [device, setDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [states, setStates] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filterPattern, setFilterPattern] = useState("All");
  const [alertSearch, setAlertSearch] = useState("");

  const [sourceIp, setSourceIp] = useState("192.168.1.105");
  const [targetPort, setTargetPort] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const [monitoring, setMonitoring] = useState(null);
  const [tcpChecking, setTcpChecking] = useState(false);
  // Handle different API response formats
  function getList(data, keys) {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  }

  // Load dashboard information
  async function loadDashboard() {
    try {
      const results = await Promise.allSettled([
        axios.get(`${API}/monitoring/wifi`),
        axios.get(`${API}/monitoring/device`),
        axios.get(`${API}/devices`),
        axios.get(`${API}/states`),
        axios.get(`${API}/alerts`),
        axios.get(`${API}/monitoring/status`)
      ]);

      if (results[0].status === "fulfilled") {
        setWifi(results[0].value.data.wifi);
      }

      if (results[1].status === "fulfilled") {
        setDevice(results[1].value.data.device);
      }

      if (results[2].status === "fulfilled") {
        setDevices(
          getList(results[2].value.data, [
            "devices",
            "data",
            "items"
          ])
        );
      }

      if (results[3].status === "fulfilled") {
        setStates(
          getList(results[3].value.data, [
            "states",
            "data",
            "items"
          ])
        );
      }

      if (results[4].status === "fulfilled") {
        setAlerts(
          getList(results[4].value.data, [
            "alerts",
            "data",
            "items"
          ])
        );
      }
      if (results[5].status === "fulfilled") {
        setMonitoring(results[5].value.data.monitoring);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(loadDashboard, 5000);

    return () => clearInterval(timer);
  }, []);

  // Send a port scan simulation event

  const simulatePort = async () => {
    if (!sourceIp.trim() || !targetPort.trim()) {
      setMessage("Please enter Source IP and Target Ports");
      return;
    }

    const ports = targetPort
      .split(",")
      .map(port => port.trim())
      .map(Number);

    if (
      ports.some(
        port => !Number.isInteger(port) || port < 1 || port > 65535
      )
    ) {
      setMessage("Enter valid ports between 1 and 65535");
      return;
    }

    if (new Set(ports).size !== ports.length) {
      setMessage("Please enter unique port numbers");
      return;
    }

    try {
      setLoading(true);
      let result;

      for (const port of ports) {
        const response = await axios.post(`${API}/simulate`, {
          sourceIp: sourceIp.trim(),
          targetPort: port
        });

        result = response.data;
      }

      setMessage(
        result.message || "All port attempts processed successfully"
      );

      setTargetPort("");
      await loadDashboard();

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Simulation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Export filtered alerts as CSV
  function exportAlerts() {
    if (filteredAlerts.length === 0) {
      setMessage("No alerts available to export.");
      return;
    }

    const headers = [
      "Source IP",
      "Targeted Ports",
      "Scan Pattern",
      "DFA State",
      "Packet Count",
      "Detected At"
    ];

    const rows = filteredAlerts.map(item => [
      item.sourceIp,
      item.targetedPorts?.join(", "),
      item.scanPattern,
      item.automataState,
      item.packetCount,
      item.timestamp
        ? new Date(item.timestamp).toLocaleString()
        : "--"
    ]);

    const csv = [headers, ...rows]
      .map(row =>
        row.map(value =>
          `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "NetGuard_Security_Alerts.csv";
    link.click();

    URL.revokeObjectURL(url);

    setMessage("Security alerts exported successfully.");
  }
  const alertCount = alerts.length;
  const filteredAlerts = alerts.filter(item => {
    const matchesPattern =
      filterPattern === "All" ||
      item.scanPattern === filterPattern;

    const matchesIP =
      item.sourceIp
        ?.toLowerCase()
        .includes(alertSearch.toLowerCase());

    return matchesPattern && matchesIP;
  });

  const activeCount = devices.filter(
    item => item.status === "Connected"
  ).length;


  async function checkTcpEvents() {
    try {
      setTcpChecking(true);
      setMessage("Checking incoming TCP connections...");

      const response = await axios.get(
        `${API}/monitoring/port-events`
      );

      const count = response.data.totalEvents || 0;
      const alerts = response.data.detectedAlerts || 0;

      setMessage(
        `TCP check completed. Events: ${count}, Alerts: ${alerts}`
      );

      await loadDashboard();

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "TCP monitoring check failed."
      );
    } finally {
      setTcpChecking(false);
    }
  }


  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">W</div>
          <div>
            <h2>NetGuard</h2>
            <span>Network Security</span>
          </div>
        </div>

        <nav>
          <a href="#overview" className="active">▦ Dashboard</a>
          <a href="#wifi">◉ Wi-Fi Monitor</a>
          <a href="#devices">▣ Devices</a>
          <a href="#automata">⌘ DFA Monitor</a>
          <a href="#alerts">⚠ Alerts</a>
          <a href="#simulation">▷ Simulation</a>
        </nav>

        <div className="sidebar-bottom">
          <span className="online-dot"></span>
          Backend Connection
          <strong>Monitoring</strong>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">

        <header className="topbar">
          <div>
            <h1>Network Monitoring Dashboard</h1>
            <p>Wi-Fi Access Point and Port Scan Detection</p>
          </div>
          <button
            className="refresh-btn"
            onClick={checkTcpEvents}
            disabled={tcpChecking}
          >
            {tcpChecking ? "Checking..." : "Check TCP Connections"}
          </button>
          <button className="refresh-btn" onClick={loadDashboard}>
            ↻ Refresh
          </button>
        </header>


        <div className="monitor-status">
          <span className={monitoring?.running ? "status-dot online" : "status-dot offline"}></span>

          {monitoring?.running
            ? "TCP Monitoring Running"
            : "TCP Monitoring Stopped"}

          <span className="monitor-interval">
            (Every 5 seconds)
          </span>
        </div><br></br>


        {/* Overview Cards */}
        <section id="overview" className="stats-grid">

          <div className="stat-card">
            <span>Wi-Fi Status</span>
            <h2>{wifi?.connected ? "Connected" : "Offline"}</h2>
            <small>{wifi?.ssid || "No network detected"}</small>
          </div>

          <div className="stat-card">
            <span>Connected Devices</span>
            <h2>{activeCount}</h2>
            <small>Saved device records</small>
          </div>

          <div className="stat-card">
            <span>Security Alerts</span>
            <h2>{alertCount}</h2>
            <small>Recorded DFA alerts</small>
          </div>

          <div className="stat-card">
            <span>DFA Active Sources</span>
            <h2>{states.length}</h2>
            <small>Currently tracked IPs</small>
          </div>

        </section>

        {/* Wi-Fi Information */}
        <section id="wifi" className="panel">
          <div className="section-heading">
            <div>
              <h2>Wi-Fi Access Point</h2>
              <p>Current wireless network information</p>
            </div>
            <span className={wifi?.connected ? "status online" : "status offline"}>
              {wifi?.connected ? "● Connected" : "● Offline"}
            </span>
          </div>

          <div className="details-grid">
            <div>
              <label>SSID</label>
              <strong>{wifi?.ssid || "--"}</strong>
            </div>
            <div>
              <label>BSSID</label>
              <strong>{wifi?.bssid || "--"}</strong>
            </div>
            <div>
              <label>Signal Strength</label>
              <strong>{wifi?.signal || "--"}</strong>
            </div>
            <div>
              <label>Channel</label>
              <strong>{wifi?.channel ?? "--"}</strong>
            </div>
            <div>
              <label>Band</label>
              <strong>{wifi?.band || "--"}</strong>
            </div>
            <div>
              <label>Gateway</label>
              <strong>{wifi?.gateway || "--"}</strong>
            </div>
          </div>
        </section>

        {/* Local Device */}
        <section id="devices" className="panel">
          <div className="section-heading">
            <div>
              <h2>Local Device Information</h2>
              <p>Your computer detected by the monitoring service</p>
            </div>
            <span className="status online">● Connected</span>
          </div>

          <div className="details-grid">
            <div>
              <label>Device Name</label>
              <strong>{device?.deviceName || "--"}</strong>
            </div>
            <div>
              <label>IP Address</label>
              <strong>{device?.ipAddress || "--"}</strong>
            </div>
            <div>
              <label>MAC Address</label>
              <strong>{device?.macAddress || "--"}</strong>
            </div>
            <div>
              <label>Monitoring Mode</label>
              <strong>{device?.mode || "--"}</strong>
            </div>
          </div>

          <h3 className="subheading">Saved Devices</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.length > 0 ? devices.map(item => (
                  <tr key={item._id}>
                    <td>{item.deviceName}</td>
                    <td>{item.ipAddress}</td>
                    <td>{item.macAddress || "--"}</td>
                    <td>{item.mode}</td>
                    <td>
                      <span className="status online">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5">No devices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* DFA States */}
        <section id="automata" className="panel">
          <div className="section-heading">
            <div>
              <h2>Finite Automata Detection</h2>
              <p>Current DFA states for tracked source IPs</p>
            </div>
          </div>

          <div className="dfa-flow">
            {["q0", "q1", "q2", "q3", "q_alert"].map(
              (state, index) => (
                <React.Fragment key={state}>
                  <div className={
                    "dfa-state " +
                    (index === 4 ? "danger-state" : "")
                  }>
                    {state}
                  </div>

                  {index < 4 && <span>→</span>}
                </React.Fragment>
              )
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source IP</th>
                  <th>DFA State</th>
                  <th>Targeted Ports</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {states.length > 0 ? states.map((item, index) => (
                  <tr key={item.sourceIp || index}>
                    <td>{item.sourceIp}</td>
                    <td>
                      <span className={
                        item.state === "q_alert"
                          ? "status offline"
                          : "status online"
                      }>
                        {item.state}
                      </span>
                    </td>
                    <td>
                      {item.targetedPorts?.join(", ") || "--"}
                    </td>
                    <td>{item.packetCount}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4">No active DFA states.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* Alerts */}
        <section id="alerts" className="panel">
          <div className="section-heading">
            <div>
              <h2>Security Alerts</h2>
              <p>Previously recorded port scan detections</p>
            </div>

            <div className="alert-actions">
              <input
                type="text"
                placeholder="Search Source IP..."
                value={alertSearch}
                onChange={e => setAlertSearch(e.target.value)}
                className="alert-search"
              />
              <select
                value={filterPattern}
                onChange={e => setFilterPattern(e.target.value)}
              >
                <option value="All">All Alerts</option>
                <option value="Sequential Scan">Sequential Scan</option>
                <option value="Random Scan">Random Scan</option>
              </select>
              <span className="status offline">
                {alertCount} Alerts
              </span>
              <button
                className="refresh-btn"
                onClick={exportAlerts}
              >
                Export CSV
              </button>
              <button
                className="refresh-btn"
                onClick={loadDashboard}
              >
                Refresh
              </button>

              <button
                className="clear-btn"
                disabled={alerts.length === 0}
                onClick={async () => {
                  if (!window.confirm("Clear all security alerts?")) {
                    return;
                  }

                  try {
                    const response = await axios.delete(`${API}/alerts`);
                    setMessage(response.data.message);
                    await loadDashboard();
                  } catch (error) {
                    setMessage("Unable to clear alerts");
                  }
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source IP</th>
                  <th>Targeted Ports</th>
                  <th>Scan Pattern</th>
                  <th>DFA State</th>
                  <th>Packet Count</th>
                  <th>Detected At</th>
                </tr>
              </thead>

              <tbody>
                {filteredAlerts.length > 0 ? filteredAlerts.map(item => (
                  <tr key={item._id}>
                    <td>{item.sourceIp}</td>
                    <td>{item.targetedPorts?.join(", ")}</td>
                    <td>{item.scanPattern}</td>
                    <td>
                      <span className="status offline">
                        {item.automataState}
                      </span>
                    </td>
                    <td>{item.packetCount}</td>
                    <td>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : "--"}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6">No alerts found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>


        {/* Simulation */}
        <section id="simulation" className="panel">
          <div className="section-heading">
            <div>
              <h2>Port Scan Simulation</h2>
              <p>Test the DFA engine using sample connection attempts</p>
            </div>
            <span className="status online">Simulation Mode</span>
          </div>

          <div className="simulation-form">
            <div>
              <label>Source IP Address</label>
              <input
                value={sourceIp}
                onChange={e => setSourceIp(e.target.value)}
                placeholder="192.168.1.105"
              />
            </div>

            <div>
              <label>Target Port</label>
              <input
                type="text"
                value={targetPort}
                onChange={e => setTargetPort(e.target.value)}
                placeholder="Example: 9000,9001,9002,9003"
              />
            </div>

            <button onClick={simulatePort}>
              Submit Attempt
            </button>
          </div>

          {message && (
            <p className="message">{message}</p>
          )}

          <p className="hint">
            Try four different ports from the same source IP
            within five seconds to test the DFA threshold.
          </p>
        </section>

        <footer>
          <span>
            {loading ? "Loading dashboard..." : "Dashboard connected"}
          </span>
          <span>Last updated: {lastUpdated || "--"}</span>
        </footer>

      </main>
    </div>
  );
}

export default App;
