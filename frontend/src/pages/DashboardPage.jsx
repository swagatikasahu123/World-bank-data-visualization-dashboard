import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  Globe, TrendingUp, Users, Wind, Wifi, BookOpen,
  LogOut, BarChart2, Activity, RefreshCw
} from 'lucide-react';
import { fetchMeta, fetchSummary, fetchTimeSeries, fetchComparison, fetchScatter } from '../services/api';
import { CustomTooltip } from '../components/CustomTooltip';

const ACCENT  = '#00e5a0';
const ACCENT2 = '#7c6aff';
const WARN    = '#ff6b35';
const COLORS  = ['#00e5a0','#7c6aff','#ff6b35','#00b8d9','#ffd700','#ff6eb3','#a8ff78','#ff9a56'];

const ICON_MAP = {
  gdp_growth: TrendingUp, gdp_per_capita: BarChart2, population: Users,
  co2_emissions: Wind, life_expectancy: Activity, internet_users: Wifi,
  literacy_rate: BookOpen, unemployment: RefreshCw,
};

function formatValue(v, unit) {
  if (v == null) return '—';
  if (unit === '%') return `${v.toFixed(1)}%`;
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Meta
  const [meta, setMeta] = useState({ indicators: {}, countries: {} });

  // Filters
  const [country, setCountry] = useState('US');
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2023);
  const [tsIndicator, setTsIndicator] = useState('gdp_growth');
  const [cmpIndicator, setCmpIndicator] = useState('gdp_per_capita');
  const [cmpYear, setCmpYear] = useState(2022);
  const [scatterX, setScatterX] = useState('gdp_per_capita');
  const [scatterY, setScatterY] = useState('life_expectancy');
  const [scatterYear, setScatterYear] = useState(2021);

  // Data
  const [summary, setSummary]     = useState(null);
  const [tsData, setTsData]       = useState(null);
  const [cmpData, setCmpData]     = useState(null);
  const [scatterData, setScatter] = useState(null);

  useEffect(() => {
    fetchMeta().then(r => setMeta(r.data));
  }, []);

  // Summary
  useEffect(() => {
    setSummary(null);
    fetchSummary(country).then(r => setSummary(r.data)).catch(() => {});
  }, [country]);

  // Time series
  useEffect(() => {
    setTsData(null);
    fetchTimeSeries(tsIndicator, country, startYear, endYear)
      .then(r => setTsData(r.data)).catch(() => {});
  }, [tsIndicator, country, startYear, endYear]);

  // Comparison bar
  const cmpCountries = ['US','CN','IN','GB','DE','JP','BR','CA','ZA','KR'];
  useEffect(() => {
    setCmpData(null);
    fetchComparison(cmpIndicator, cmpCountries, cmpYear)
      .then(r => setCmpData(r.data)).catch(() => {});
  }, [cmpIndicator, cmpYear]);

  // Scatter
  useEffect(() => {
    setScatter(null);
    fetchScatter(scatterX, scatterY, scatterYear)
      .then(r => setScatter(r.data)).catch(() => {});
  }, [scatterX, scatterY, scatterYear]);

  const years = Array.from({ length: 2024 - 1990 }, (_, i) => 1990 + i);
  const indicatorKeys = Object.keys(meta.indicators);

  const summaryCards = summary
    ? Object.entries(summary.indicators || {}).slice(0, 6)
    : Array(6).fill(null);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Globe size={16} color="#0a0a0a" strokeWidth={2.5} />
          </div>
          <span>Global<em>Pulse</em></span>
        </div>

        <div className="sidebar-section-label">Charts</div>
        {[
          { icon: TrendingUp, label: 'Time Series' },
          { icon: BarChart2,  label: 'Country Compare' },
          { icon: Activity,   label: 'Scatter Plot' },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="sidebar-nav-item active">
            <Icon size={15} /> {label}
          </button>
        ))}

        <div className="sidebar-user" style={{ marginTop: 'auto' }}>
          <div className="sidebar-user-name">{user?.firstName || user?.username}</div>
          <div className="sidebar-user-role">Analyst</div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <h1>World Bank Dashboard</h1>
            <p>Global development data · Updated on page load</p>
          </div>
        </div>

        {/* Global filters */}
        <div className="filters-bar">
          <span className="filter-label">Country</span>
          <select className="select-field" value={country} onChange={e => setCountry(e.target.value)}>
            {Object.entries(meta.countries).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <span className="filter-label" style={{ marginLeft: '1rem' }}>Year Range</span>
          <select className="select-field" value={startYear} onChange={e => setStartYear(+e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>→</span>
          <select className="select-field" value={endYear} onChange={e => setEndYear(+e.target.value)}>
            {years.filter(y => y > startYear).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          {summaryCards.map((entry, i) => {
            const [key, data] = entry || [null, null];
            const Icon = key ? (ICON_MAP[key] || Activity) : Activity;
            return (
              <div key={i} className="stat-card">
                <div className="stat-label">
                  <Icon size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {data?.label ?? '···'}
                </div>
                <div className="stat-value" style={{ color: COLORS[i % COLORS.length] }}>
                  {data ? formatValue(data.value, data.unit) : <span style={{ opacity: 0.3 }}>—</span>}
                </div>
                <div className="stat-meta">{data?.year ?? ''} · {summary?.country ?? ''}</div>
              </div>
            );
          })}
        </div>

        {/* ── Chart 1: Time Series Line Chart ── */}
        <div className="charts-grid">
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-header">
              <div>
                <div className="chart-title">📈 Time Series Analysis</div>
                <div className="chart-subtitle">
                  {meta.indicators[tsIndicator]?.label} · {meta.countries[country]} · {startYear}–{endYear}
                </div>
              </div>
              <div className="chart-controls">
                <select className="select-field" value={tsIndicator} onChange={e => setTsIndicator(e.target.value)}>
                  {indicatorKeys.map(k => (
                    <option key={k} value={k}>{meta.indicators[k]?.label || k}</option>
                  ))}
                </select>
              </div>
            </div>

            {tsData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tsData.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="year" tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#6b6b80' }} />
                  <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#6b6b80' }} width={70}
                    tickFormatter={v => typeof v === 'number' && v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v} />
                  <Tooltip content={<CustomTooltip unit={tsData?.unit} />} />
                  <Line type="monotone" dataKey="value" name={meta.indicators[tsIndicator]?.label}
                    stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3, fill: ACCENT }}
                    activeDot={{ r: 6, fill: ACCENT }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {tsData === null ? 'Loading data from World Bank API…' : 'No data available for this selection'}
              </div>
            )}
          </div>
        </div>

        {/* ── Chart 2: Country Comparison Bar Chart ── */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">🌍 Country Comparison</div>
                <div className="chart-subtitle">
                  {meta.indicators[cmpIndicator]?.label} · {cmpYear}
                </div>
              </div>
              <div className="chart-controls">
                <select className="select-field" value={cmpIndicator} onChange={e => setCmpIndicator(e.target.value)}>
                  {indicatorKeys.map(k => (
                    <option key={k} value={k}>{meta.indicators[k]?.label || k}</option>
                  ))}
                </select>
                <select className="select-field" value={cmpYear} onChange={e => setCmpYear(+e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {cmpData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cmpData.data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="country" tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#6b6b80' }}
                    angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#6b6b80' }} width={70}
                    tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v} />
                  <Tooltip content={<CustomTooltip unit={cmpData?.unit} />} />
                  <Bar dataKey="value" name={meta.indicators[cmpIndicator]?.label} radius={[4, 4, 0, 0]}>
                    {cmpData.data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {cmpData === null ? 'Loading…' : 'No data available'}
              </div>
            )}
          </div>

          {/* ── Chart 3: Scatter Plot ── */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">🔬 Correlation Scatter</div>
                <div className="chart-subtitle">
                  {meta.indicators[scatterX]?.label} vs {meta.indicators[scatterY]?.label} · {scatterYear}
                </div>
              </div>
              <div className="chart-controls">
                <select className="select-field" value={scatterX} onChange={e => setScatterX(e.target.value)}>
                  {indicatorKeys.map(k => <option key={k} value={k}>X: {meta.indicators[k]?.label || k}</option>)}
                </select>
                <select className="select-field" value={scatterY} onChange={e => setScatterY(e.target.value)}>
                  {indicatorKeys.map(k => <option key={k} value={k}>Y: {meta.indicators[k]?.label || k}</option>)}
                </select>
                <select className="select-field" value={scatterYear} onChange={e => setScatterYear(+e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {scatterData?.data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis type="number" dataKey="x" name={scatterData.x_label}
                    tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#6b6b80' }}
                    label={{ value: scatterData.x_label, position: 'insideBottom', offset: -5,
                      style: { fontFamily: 'Space Mono', fontSize: 10, fill: '#6b6b80' } }} />
                  <YAxis type="number" dataKey="y" name={scatterData.y_label}
                    tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#6b6b80' }} width={60} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="custom-tooltip">
                          <div className="label" style={{ fontWeight: 700, color: 'var(--text)' }}>{d?.country}</div>
                          <div className="value">{scatterData.x_label}: {d?.x?.toLocaleString()}</div>
                          <div className="value" style={{ color: ACCENT2 }}>{scatterData.y_label}: {d?.y?.toLocaleString()}</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData.data} fill={ACCENT2} fillOpacity={0.8} r={7} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {scatterData === null ? 'Loading…' : 'No data available'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid var(--border)',
          color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textAlign: 'center' }}>
          Data sourced from World Bank Open Data API · Built with Django + React · DeepQ-AI Internship Assignment
        </div>
      </main>
    </div>
  );
}
