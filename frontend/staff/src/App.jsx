import { useEffect, useMemo, useState } from 'react'
import logo from '../assets/rmutl-logo.png'

const initialPackages = [
  { tracking: 'PKG-20260901-001', recipient: 'สมชาย ใจดี', room: 'A-204', building: 'A', status: 'รอรับพัสดุ', date: '1 ก.ย. 2569' },
  { tracking: 'PKG-20260901-002', recipient: 'มาริ ศรีดี', room: 'B-105', building: 'B', status: 'รอรับพัสดุ', date: '1 ก.ย. 2569' },
  { tracking: 'PKG-20260831-014', recipient: 'ปกรณ์ มั่นคง', room: 'A-402', building: 'A', status: 'รับแล้ว', date: '31 ส.ค. 2569' },
  { tracking: 'PKG-20260831-009', recipient: 'วินัย รัตนา', room: 'A-204', building: 'A', status: 'รับแล้ว', date: '31 ส.ค. 2569' },
  { tracking: 'PKG-20260825-003', recipient: 'สัญชัย เข็ม', room: 'A-312', building: 'A', status: 'รอรับพัสดุ', date: '25 ส.ค. 2569' },
]
const blankForm = { tracking: '', studentId: '', recipient: '', phone: '', room: '', building: 'A', note: '' }

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [filter, setFilter] = useState('A')
  const [packages, setPackages] = useState(() => JSON.parse(localStorage.getItem('dorm-packages') || 'null') || initialPackages)
  const [form, setForm] = useState(blankForm)
  const [editingIndex, setEditingIndex] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem('dorm-packages', JSON.stringify(packages)), [packages])
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 2400); return () => clearTimeout(timer) }, [toast])

  const visiblePackages = useMemo(() => packages.map((item, index) => ({ item, index })).filter(({ item }) => filter === 'all' ? item.status === 'รอรับพัสดุ' : item.building === filter), [packages, filter])
  const pending = packages.filter(item => item.status === 'รอรับพัสดุ').length
  const received = packages.filter(item => item.status === 'รับแล้ว').length

  const dashboard = (nextFilter = 'A') => { setFilter(nextFilter); setPage('dashboard') }
  const newPackage = () => { setEditingIndex(null); setForm(blankForm); setPhotoUrl(''); setPage('packages') }
  const editPackage = (item, index) => { setEditingIndex(index); setForm({ ...blankForm, ...item }); setPhotoUrl(''); setPage('packages'); window.scrollTo(0, 0) }
  const savePackage = event => {
    event.preventDefault()
    const item = { ...form, status: editingIndex === null ? 'รอรับพัสดุ' : packages[editingIndex].status, date: editingIndex === null ? 'วันนี้' : packages[editingIndex].date }
    setPackages(current => editingIndex === null ? [item, ...current] : current.map((currentItem, index) => index === editingIndex ? item : currentItem))
    setToast(editingIndex === null ? 'บันทึกพัสดุเรียบร้อยแล้ว' : 'อัปเดตข้อมูลพัสดุเรียบร้อยแล้ว')
    setEditingIndex(null); setForm(blankForm); setPhotoUrl(''); dashboard()
  }

  return <>
    <header className="topbar">
      <button className="brand brand-button" onClick={() => dashboard()} aria-label="หน้าหลัก"><span className="brand-icon"><img src={logo} alt="ตราสัญลักษณ์มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา" /></span><span><b>ระบบติดตามพัสดุหอพัก</b><small>มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา</small></span></button>
      <nav><button className={page === 'dashboard' && filter !== 'all' ? 'active' : ''} onClick={() => dashboard()}>หน้าหลัก</button><button className={page === 'packages' ? 'active' : ''} onClick={() => setPage('packages')}>จัดการพัสดุ</button><button className={page === 'dashboard' && filter === 'all' ? 'active' : ''} onClick={() => dashboard('all')}>พัสดุตกค้าง</button></nav>
      <button className="profile" type="button"><span className="avatar">ธ</span><span><b>ธรรมชาติ ดีใจ</b><small>เจ้าหน้าที่หอพักชาย A</small></span></button>
    </header>
    <main>{page === 'dashboard' ? <Dashboard visiblePackages={visiblePackages} pending={pending} received={received} filter={filter} setFilter={setFilter} onNew={newPackage} onEdit={editPackage} /> : <PackageForm form={form} setForm={setForm} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} isEditing={editingIndex !== null} onSave={savePackage} onCancel={() => dashboard()} />}</main>
    <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
  </>
}

function Dashboard({ visiblePackages, pending, received, filter, setFilter, onNew, onEdit }) {
  const filters = [['A', 'หอพักชาย ตึก A'], ['B', 'หอพักหญิง ตึก B'], ['all', 'เฉพาะพัสดุตกค้าง']]
  return <section className="page active-page">
    <div className="page-heading"><div><h1>แดชบอร์ดเจ้าหน้าที่หอพัก</h1><p>ภาพรวมข้อมูลพัสดุ ตรวจสอบและจัดการได้อย่างสะดวก</p></div><button className="primary" onClick={onNew}>＋ เพิ่มพัสดุใหม่</button></div>
    <div className="stats"><Stat icon="◴" tone="orange" label="พัสดุรอรับวันนี้" value="12" unit="ชิ้น" /><Stat icon="!" tone="orange" label="พัสดุตกค้าง" value={pending} unit="ชิ้น" /><Stat icon="✓" tone="green" label="พัสดุรับแล้ว" value={128 + received - 2} unit="ชิ้น" /><Stat icon="♧" tone="gray" label="นักศึกษา/พักทั้งหมด" value="240" unit="คน" /></div>
    <section className="filter-card"><b>ตัวกรองด่วน:</b>{filters.map(([value, label]) => <button key={value} className={`filter ${filter === value ? 'selected' : ''}`} onClick={() => setFilter(value)}>{label}</button>)}</section>
    <section className="table-card"><h2>พัสดุลงทะเบียนล่าสุด</h2><div className="table-scroll"><table><thead><tr><th>เลขพัสดุ</th><th>ชื่อผู้รับ</th><th>ห้อง</th><th>ตึก</th><th>สถานะ</th><th>วันที่รับเข้า</th></tr></thead><tbody>{visiblePackages.length ? visiblePackages.map(({ item, index }) => <tr key={item.tracking} onClick={() => onEdit(item, index)}><td>{item.tracking}</td><td>{item.recipient}</td><td>{item.room}</td><td>หอพัก{item.building === 'A' ? 'ชาย' : 'หญิง'} ตึก {item.building}</td><td><span className={`badge ${item.status === 'รับแล้ว' ? 'done' : 'pending'}`}>{item.status}</span></td><td>{item.date}</td></tr>) : <tr><td colSpan="6">ไม่พบรายการพัสดุ</td></tr>}</tbody></table></div></section>
  </section>
}

function Stat({ icon, tone, label, value, unit }) { return <article><span className={`stat-icon ${tone}`}>{icon}</span><p>{label}</p><strong>{value} <em>{unit}</em></strong></article> }

function PackageForm({ form, setForm, photoUrl, setPhotoUrl, isEditing, onSave, onCancel }) {
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const choosePhoto = event => { const file = event.target.files?.[0]; if (file) setPhotoUrl(URL.createObjectURL(file)) }
  return <section className="page active-page"><div className="breadcrumbs">หน้าหลัก <span>/</span> จัดการพัสดุ <span>/</span> <b>{isEditing ? 'แก้ไขข้อมูลพัสดุ' : 'บันทึกพัสดุใหม่'}</b></div><section className="form-card"><form onSubmit={onSave}><div className="form-side"><h2>รายละเอียดพัสดุ</h2><div className="form-grid"><Field label="เลขพัสดุ (Tracking Number)" name="tracking" form={form} update={update} placeholder="เช่น PKG-20260901-001" required /><Field label="รหัสนักศึกษา" name="studentId" form={form} update={update} placeholder="6501012345" required /><Field label="ชื่อผู้รับ (นักศึกษา/ผู้รับ)" name="recipient" form={form} update={update} placeholder="สมชาย ใจดี" required /><Field label="เบอร์โทรศัพท์" name="phone" form={form} update={update} placeholder="0891234567" /><Field label="ห้อง" name="room" form={form} update={update} placeholder="A-204" required /><label>ตึกพัก<select name="building" value={form.building} onChange={update}><option value="A">หอพักชาย ตึก A</option><option value="B">หอพักหญิง ตึก B</option></select></label></div><label>หมายเหตุ<textarea name="note" value={form.note} onChange={update} placeholder="กรอกรายละเอียดเพิ่มเติม" /></label><div className="actions"><button className="primary" type="submit">บันทึกข้อมูลพัสดุ</button><button className="secondary" type="button" onClick={onCancel}>ยกเลิก</button></div></div><div className="photo-side"><h3>ถ่ายภาพกล่องพัสดุ</h3><div className="photo-preview" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}>{!photoUrl && <><span>📦</span><p>ยังไม่มีรูปภาพ</p></>}</div><div className="photo-actions"><label className="outline upload-label">▧&nbsp; เลือกไฟล์<input type="file" accept="image/*" hidden onChange={choosePhoto} /></label><button className="secondary" type="button" onClick={() => setPhotoUrl('')}>ล้างไฟล์</button></div></div></form></section></section>
}

function Field({ label, name, form, update, ...props }) { return <label>{label}<input name={name} value={form[name]} onChange={update} {...props} /></label> }
