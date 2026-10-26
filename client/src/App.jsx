import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from './api'
import { categories, demoReports } from './data'
import {
  Activity, ArrowUpRight, Bell, CheckCircle2, ChevronDown, CircleHelp, Clock3, FileText,
  Filter, ImagePlus, LayoutDashboard, Lightbulb, LogOut, MapPin, Menu, MessageSquare,
  MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Trash2, TrendingUp, UserRound, X
} from 'lucide-react'

const statusTone = { Pending: 'pending', 'In Progress': 'progress', Resolved: 'resolved' }

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('civicfix_user') || 'null'))
  const [reports, setReports] = useState(demoReports)
  const [page, setPage] = useState('overview')
  const [modal, setModal] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [filters, setFilters] = useState({ search: '', status: 'All statuses', category: 'All categories' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [user])

  async function loadReports() {
    try {
      const data = await apiRequest('/reports')
      setReports(data.reports || [])
    } catch { /* Demo mode keeps the experience usable without MongoDB. */ }
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  async function handleLogin(form) {
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('civicfix_token', data.token)
      localStorage.setItem('civicfix_user', JSON.stringify(data.user))
      setUser(data.user)
      setModal(null)
      showToast('Welcome back to CivicFix')
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        const demoUser = { id: 'demo-user', name: 'Alex Morgan', email: form.email, role: 'user' }
        localStorage.setItem('civicfix_user', JSON.stringify(demoUser))
        setUser(demoUser)
        setModal(null)
        showToast('Demo mode enabled — connect MongoDB to use live accounts')
      } else showToast(error.message)
    }
  }

  async function handleRegister(form) {
    try {
      const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('civicfix_token', data.token)
      localStorage.setItem('civicfix_user', JSON.stringify(data.user))
      setUser(data.user)
      setModal(null)
      showToast('Your CivicFix account is ready')
    } catch (error) { showToast(error.message) }
  }

  async function handleNewReport(form) {
    setLoading(true)
    try {
      const data = await apiRequest('/reports', { method: 'POST', body: JSON.stringify(form) })
      setReports(current => [data.report, ...current])
      showToast('Report submitted — thank you for helping your community')
    } catch {
      const localReport = { ...form, _id: `CF-${1050 + reports.length}`, status: 'Pending', createdAt: new Date().toISOString(), comments: [] }
      setReports(current => [localReport, ...current])
      showToast('Saved locally for demo. Connect MongoDB to sync it with your city.')
    } finally { setLoading(false); setModal(null) }
  }

  async function updateReport(id, update) {
    try {
      const data = await apiRequest(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(update) })
      setReports(current => current.map(report => report._id === id ? data.report : report))
      showToast('Report updated successfully')
    } catch {
      setReports(current => current.map(report => report._id === id ? { ...report, ...update } : report))
      showToast('Updated in demo mode')
    }
  }

  const filteredReports = useMemo(() => reports.filter(report => {
    const textMatch = `${report.title} ${report.location} ${report.description}`.toLowerCase().includes(filters.search.toLowerCase())
    return textMatch && (filters.status === 'All statuses' || report.status === filters.status) && (filters.category === 'All categories' || report.category === filters.category)
  }), [reports, filters])

  if (!user) return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />

  const stats = [
    { label: 'Total reports', value: reports.length, icon: FileText, color: 'teal', change: '+12.5%', detail: 'vs last month' },
    { label: 'Pending review', value: reports.filter(r => r.status === 'Pending').length, icon: Clock3, color: 'amber', change: 'Needs attention', detail: 'across your area' },
    { label: 'In progress', value: reports.filter(r => r.status === 'In Progress').length, icon: Activity, color: 'blue', change: 'Being handled', detail: 'by city teams' },
    { label: 'Resolved', value: reports.filter(r => r.status === 'Resolved').length, icon: CheckCircle2, color: 'green', change: '+8.2%', detail: 'this month' },
  ]

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><span>Civic<span>Fix</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        <NavItem icon={LayoutDashboard} label="Overview" active={page === 'overview'} onClick={() => { setPage('overview'); setMenuOpen(false) }} />
        <NavItem icon={FileText} label="My reports" count={reports.length} active={page === 'reports'} onClick={() => { setPage('reports'); setMenuOpen(false) }} />
        <NavItem icon={MapPin} label="Explore issues" active={page === 'explore'} onClick={() => { setPage('explore'); setMenuOpen(false) }} />
      </nav>
      <div className="sidebar-bottom">
        <NavItem icon={CircleHelp} label="Help center" />
        <NavItem icon={Settings} label="Settings" />
        <div className="sidebar-tip"><Lightbulb size={17} /><div><strong>Have an idea?</strong><span>Help us improve CivicFix</span></div><ArrowUpRight size={15} /></div>
      </div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{page === 'overview' ? 'Overview' : page === 'reports' ? 'My reports' : 'Explore issues'}</strong></div><div className="top-actions"><button className="icon-button"><Bell size={19} /><i /></button><div className="avatar" onClick={() => setModal('profile')}>{user.name?.charAt(0).toUpperCase() || 'A'}</div><button className="user-switch" onClick={() => setModal('profile')}><strong>{user.name || 'Alex Morgan'}</strong><ChevronDown size={15} /></button></div></header>
      {page === 'overview' && <Overview reports={reports} stats={stats} onReport={() => setModal('report')} onBrowse={() => setPage('reports')} onUpdate={updateReport} />}
      {page === 'reports' && <ReportsPage reports={filteredReports} filters={filters} setFilters={setFilters} onReport={() => setModal('report')} onUpdate={updateReport} />}
      {page === 'explore' && <ReportsPage reports={filteredReports} filters={filters} setFilters={setFilters} onReport={() => setModal('report')} onUpdate={updateReport} explore />}
    </main>
    {modal === 'report' && <ReportModal onClose={() => setModal(null)} onSubmit={handleNewReport} loading={loading} />}
    {modal === 'profile' && <ProfileModal user={user} onClose={() => setModal(null)} onLogout={() => { localStorage.clear(); setUser(null); setModal(null) }} />}
    {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
  </div>
}

function NavItem({ icon: Icon, label, count, active, onClick }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon size={18} /><span>{label}</span>{count !== undefined && <small>{count}</small>}</button> }

function Overview({ reports, stats, onReport, onBrowse, onUpdate }) {
  return <div className="page-wrap"><section className="hero"><div><p className="eyebrow"><span className="live-dot" /> CITY OF NORTHSTAR · COMMUNITY HUB</p><h1>Good morning, <em>Alex.</em></h1><p className="hero-copy">Small actions make a big difference. Keep your neighborhood moving forward.</p></div><button className="primary-button" onClick={onReport}><Plus size={18} /> Report an issue</button></section>
    <section className="stat-grid">{stats.map(stat => <StatCard key={stat.label} {...stat} />)}</section>
    <section className="content-grid"><div className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">ACTIVITY OVERVIEW</p><h2>Community impact</h2></div><select defaultValue="Last 30 days"><option>Last 30 days</option><option>Last 90 days</option></select></div><div className="chart-summary"><strong>82%</strong><span><TrendingUp size={14} /> 14% more resolved</span></div><div className="chart"><div className="y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart-area"><div className="grid-line one" /><div className="grid-line two" /><div className="grid-line three" /><div className="grid-line four" /><svg viewBox="0 0 650 190" preserveAspectRatio="none" role="img" aria-label="Resolution trend chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1b927f" stopOpacity=".22" /><stop offset="1" stopColor="#1b927f" stopOpacity="0" /></linearGradient></defs><path d="M0,145 C50,136 64,158 105,128 S180,125 215,136 S270,82 315,101 S375,128 410,90 S460,105 500,69 S550,72 580,50 S620,43 650,24 L650,190 L0,190Z" fill="url(#chartFill)" /><path d="M0,145 C50,136 64,158 105,128 S180,125 215,136 S270,82 315,101 S375,128 410,90 S460,105 500,69 S550,72 580,50 S620,43 650,24" fill="none" stroke="#188875" strokeWidth="3" strokeLinecap="round" /></svg><div className="x-axis"><span>Aug 01</span><span>Aug 08</span><span>Aug 15</span><span>Aug 22</span><span>Aug 30</span></div></div></div></div>
      <div className="panel action-panel"><div className="panel-heading"><div><p className="eyebrow">QUICK ACTIONS</p><h2>Make an impact</h2></div></div><button className="action-card teal" onClick={onReport}><div className="action-icon"><Plus size={20} /></div><div><strong>Report a new issue</strong><span>See something? Let your city know.</span></div><ArrowUpRight size={18} /></button><button className="action-card cream" onClick={onBrowse}><div className="action-icon"><MapPin size={20} /></div><div><strong>Explore your area</strong><span>See what's happening nearby.</span></div><ArrowUpRight size={18} /></button><div className="impact-note"><ShieldCheck size={19} /><div><strong>Your voice matters</strong><span>Every report helps build a better city.</span></div></div></div></section>
    <section className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Your latest reports</h2></div><button className="text-button" onClick={onBrowse}>View all reports <ArrowUpRight size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>ISSUE</th><th>LOCATION</th><th>DATE REPORTED</th><th>STATUS</th><th /></tr></thead><tbody>{reports.slice(0, 4).map(report => <ReportRow key={report._id} report={report} onUpdate={onUpdate} />)}</tbody></table></div></section>
  </div>
}

function StatCard({ label, value, icon: Icon, color, change, detail }) { return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={19} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className={`stat-change ${color === 'amber' ? 'muted' : ''}`}>{color === 'teal' || color === 'green' ? <TrendingUp size={13} /> : null}{change} <span>{detail}</span></div></div> }

function ReportsPage({ reports, filters, setFilters, onReport, onUpdate, explore }) { return <div className="page-wrap"><section className="page-title"><div><p className="eyebrow">{explore ? 'NORTHSTAR COMMUNITY' : 'YOUR ACTIVITY'}</p><h1>{explore ? 'Explore local issues' : 'My reports'}</h1><p>{explore ? 'Stay informed about what is happening around your neighborhood.' : 'Track every issue you have raised with the city.'}</p></div><button className="primary-button" onClick={onReport}><Plus size={18} /> Report an issue</button></section><div className="filter-bar"><div className="search-box"><Search size={17} /><input placeholder="Search reports..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></div><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option>All statuses</option><option>Pending</option><option>In Progress</option><option>Resolved</option></select><select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option>All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select><button className="filter-button"><Filter size={16} /> Filters</button></div><div className="panel reports-panel"><div className="reports-count"><strong>{reports.length} reports</strong><span>Sorted by most recent</span></div><div className="table-wrap"><table><thead><tr><th>ISSUE</th><th>CATEGORY</th><th>LOCATION</th><th>DATE REPORTED</th><th>STATUS</th><th /></tr></thead><tbody>{reports.length ? reports.map(report => <ReportRow key={report._id} report={report} onUpdate={onUpdate} detailed />) : <tr><td colSpan="6" className="empty-state"><Search size={25} /><strong>No reports found</strong><span>Try adjusting your filters or report a new issue.</span></td></tr>}</tbody></table></div></div></div> }

function ReportRow({ report, onUpdate, detailed }) { return <tr><td><div className="issue-cell"><div className="issue-thumb"><MapPin size={16} /></div><div><strong>{report.title}</strong><span>{report._id}</span></div></div></td>{detailed && <td><span className="category-text">{report.category}</span></td>}<td><span className="location-cell"><MapPin size={14} />{report.location}</span></td><td><span className="date-cell">{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></td><td><button className={`status-pill ${statusTone[report.status]}`} onClick={() => onUpdate(report._id, { status: report.status === 'Pending' ? 'In Progress' : report.status === 'In Progress' ? 'Resolved' : 'Pending' })}><i />{report.status}</button></td><td><button className="more-button" aria-label="More options"><MoreHorizontal size={18} /></button></td></tr> }

function AuthScreen({ onLogin, onRegister }) { const [mode, setMode] = useState('login'); return <div className="auth-screen"><div className="auth-art"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-copy"><div className="brand light"><div className="brand-mark"><Sparkles size={17} /></div><span>Civic<span>Fix</span></span></div><h1>Better neighborhoods<br /><em>start with you.</em></h1><p>Report the things that matter. Together, we can make Northstar a better place to live.</p><div className="auth-stat"><strong>12,480</strong><span>community members making a difference</span></div></div><div className="auth-art-footer"><span>© 2024 CivicFix</span><span>Built for better cities</span></div></div><div className="auth-form-wrap"><div className="auth-form"><div className="mobile-auth-logo"><div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><span>Civic<span>Fix</span></span></div></div><p className="eyebrow">WELCOME TO CIVICFIX</p><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="form-intro">{mode === 'login' ? 'Sign in to track your impact on the community.' : 'Join your neighbors in making a difference.'}</p><AuthForm mode={mode} onSubmit={mode === 'login' ? onLogin : onRegister} /><div className="form-switch">{mode === 'login' ? 'New to CivicFix?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div></div></div></div> }

function AuthForm({ mode, onSubmit }) { const [form, setForm] = useState({ name: '', email: 'alex@example.com', password: 'password123' }); const [error, setError] = useState(''); const update = e => setForm({ ...form, [e.target.name]: e.target.value }); return <form className="auth-fields" onSubmit={e => { e.preventDefault(); if (!form.email || !form.password || (mode === 'register' && !form.name)) return setError('Please complete all required fields.'); onSubmit(form) }}>
  {mode === 'register' && <label>Full name<input name="name" placeholder="Alex Morgan" value={form.name} onChange={update} required /></label>}
  <label>Email address<input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={update} required /></label>
  <label>Password<div className="password-field"><input type="password" name="password" placeholder="••••••••" value={form.password} onChange={update} required /><span>Show</span></div></label>
  {mode === 'login' && <div className="form-meta"><label className="checkbox"><input type="checkbox" defaultChecked /> Remember me</label><button type="button" className="forgot">Forgot password?</button></div>}
  {error && <p className="form-error">{error}</p>}<button className="primary-button full" type="submit">{mode === 'login' ? 'Sign in to CivicFix' : 'Create my account'} <ArrowUpRight size={17} /></button>
  </form> }

function ReportModal({ onClose, onSubmit, loading }) { const [form, setForm] = useState({ title: '', description: '', category: categories[0], location: '', imageUrl: '' }); const update = e => setForm({ ...form, [e.target.name]: e.target.value }); const handleImage = e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setForm(current => ({ ...current, imageUrl: reader.result })); reader.readAsDataURL(file) }; return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><p className="eyebrow">NEW REPORT</p><h2>Tell us what needs fixing</h2></div><button className="close-button" onClick={onClose}><X size={20} /></button></div><form onSubmit={e => { e.preventDefault(); if (form.title && form.description && form.location) onSubmit(form) }}><label>Issue title<input name="title" placeholder="e.g. Pothole on Market Street" value={form.title} onChange={update} required /></label><div className="two-col"><label>Category<select name="category" value={form.category} onChange={update}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Location<input name="location" placeholder="Street, area, or landmark" value={form.location} onChange={update} required /></label></div><label>Description<textarea name="description" placeholder="Tell us a little more about the issue..." value={form.description} onChange={update} rows="4" required /></label><label className="upload-box"><ImagePlus size={22} /><span><strong>{form.imageUrl ? 'Photo attached' : 'Add a photo'}</strong> (optional)<small>JPG, PNG up to 10MB</small></span><input type="file" accept="image/*" onChange={handleImage} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={loading}>{loading ? 'Submitting...' : 'Submit report'} <ArrowUpRight size={17} /></button></div></form></div></div> }

function ProfileModal({ user, onClose, onLogout }) { return <div className="modal-backdrop"><div className="modal profile-modal"><button className="close-button" onClick={onClose}><X size={20} /></button><div className="profile-avatar">{user.name?.charAt(0).toUpperCase() || 'A'}</div><h2>{user.name || 'Alex Morgan'}</h2><p>{user.email}</p><div className="profile-actions"><button className="secondary-button" onClick={onClose}>Close</button><button className="danger-button" onClick={onLogout}><LogOut size={16} /> Sign out</button></div></div></div> }

export default App
