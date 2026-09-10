import { useEffect, useMemo, useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import PackageManagement from './components/PackageManagement'
import PackageForm from './components/PackageForm'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import Toast from './components/Toast'
import { initialPackages, blankForm, getStudentMatchStatus } from './data/mockData'

export default function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'packages' | 'package-form'
  const [filter, setFilter] = useState('all') // 'all' | 'A' | 'B' | 'unmatched'
  const [packages, setPackages] = useState(
    () => JSON.parse(localStorage.getItem('dorm-packages') || 'null') || initialPackages
  )
  const [form, setForm] = useState(blankForm)
  const [editingIndex, setEditingIndex] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem('dorm-packages', JSON.stringify(packages))
  }, [packages])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const visiblePackages = useMemo(() => {
    return packages
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (filter === 'all') return true
        if (filter === 'unmatched') return !getStudentMatchStatus(item).matched
        return item.building === filter
      })
  }, [packages, filter])

  const unmatchedCount = useMemo(() => {
    return packages.filter(item => !getStudentMatchStatus(item).matched).length
  }, [packages])

  const totalReceived = 126 + packages.filter(item => item.status === 'รับแล้ว').length
  const todayReceived =
    packages.filter(
      item =>
        item.status === 'รับแล้ว' &&
        (item.date === 'วันนี้' || item.receivedDate === 'วันนี้')
    ).length || 5

  const dashboard = (nextFilter = 'all') => {
    setFilter(nextFilter)
    setPage('dashboard')
  }

  const openManagePackages = () => {
    setPage('packages')
  }

  const newPackage = () => {
    setEditingIndex(null)
    setForm(blankForm)
    setPhotoUrl('')
    setPage('package-form')
  }

  const editPackage = (item, index) => {
    setEditingIndex(index)
    setForm({ ...blankForm, ...item, status: item.status || 'รอรับพัสดุ' })
    setPhotoUrl(item.photoUrl || '')
    setPage('package-form')
    window.scrollTo(0, 0)
  }

  const requestDelete = (item, index) => {
    setDeleteTarget({ item, index })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const { item, index } = deleteTarget
    setPackages(current => current.filter((_, i) => i !== index))
    setToast(`ลบพัสดุ ${item.tracking} สำเร็จแล้ว`)
    setDeleteTarget(null)
  }

  const savePackage = event => {
    event.preventDefault()
    // ดึงข้อมูลนักศึกษาจากชื่อที่กรอกอัตโนมัติ
    const match = getStudentMatchStatus(form)
    const matchedStudent = match.matched ? match.student : null
    const prevItem = editingIndex !== null ? packages[editingIndex] : null

    const item = {
      ...form,
      studentId: matchedStudent
        ? matchedStudent.student_id
        : (prevItem?.studentId || '-'),
      room: matchedStudent
        ? matchedStudent.room_number
        : (prevItem?.room || '-'),
      building: matchedStudent
        ? matchedStudent.building
        : (prevItem?.building || 'A'),
      phone: matchedStudent
        ? matchedStudent.phone
        : (prevItem?.phone || '-'),
      photoUrl,
      status: form.status || (editingIndex === null ? 'รอรับพัสดุ' : packages[editingIndex].status),
      date: editingIndex === null ? 'วันนี้' : packages[editingIndex].date,
    }
    setPackages(current =>
      editingIndex === null
        ? [item, ...current]
        : current.map((currentItem, index) => (index === editingIndex ? item : currentItem))
    )
    setToast(
      editingIndex === null ? 'บันทึกพัสดุใหม่เรียบร้อยแล้ว' : 'อัปเดตข้อมูลพัสดุเรียบร้อยแล้ว'
    )
    setEditingIndex(null)
    setForm(blankForm)
    setPhotoUrl('')
    setPage('packages')
  }

  return (
    <>
      <Navbar
        page={page}
        onGoDashboard={dashboard}
        onGoPackages={openManagePackages}
      />

      <main>
        {page === 'dashboard' && (
          <Dashboard
            visiblePackages={visiblePackages}
            unmatchedCount={unmatchedCount}
            todayReceived={todayReceived}
            totalReceived={totalReceived}
            filter={filter}
            setFilter={setFilter}
            onNew={newPackage}
            onEdit={editPackage}
          />
        )}

        {page === 'packages' && (
          <PackageManagement
            packages={packages}
            onNew={newPackage}
            onEdit={editPackage}
            onDelete={requestDelete}
          />
        )}

        {page === 'package-form' && (
          <PackageForm
            form={form}
            setForm={setForm}
            photoUrl={photoUrl}
            setPhotoUrl={setPhotoUrl}
            isEditing={editingIndex !== null}
            onSave={savePackage}
            onCancel={openManagePackages}
            onDashboard={() => dashboard('all')}
          />
        )}
      </main>

      <ConfirmDeleteModal
        target={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast message={toast} />
    </>
  )
}
