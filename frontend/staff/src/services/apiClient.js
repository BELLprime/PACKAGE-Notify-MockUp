/**
 * API Client Service Layer (Task 16.2 - Staff UI)
 * จัดการการติดต่อสื่อสารผ่าน HTTP ไปยัง Backend API ไว้ที่ศูนย์กลาง
 * รองรับ VITE_API_BASE_URL จาก environment (.env)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body.error || body.message || `คำขอไม่สำเร็จ (${response.status})`;
  } catch {
    return `คำขอไม่สำเร็จ (${response.status})`;
  }
}

/**
 * ฟังก์ชันกลางสำหรับส่ง HTTP Request ผ่าน Fetch API
 */
export async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch (netErr) {
    throw new ApiError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend (พอร์ต 5000) ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดทำงานอยู่', 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Services สำหรับ Staff UI
 */
export const staffApi = {
  // ดึงรายการพัสดุทั้งหมด
  getPackages: () => apiFetch('/api/packages'),

  // บันทึกพัสดุใหม่ (ระบบจะ verify ชื่อ Exact Match อัตโนมัติ)
  createPackage: (packageData) => apiFetch('/api/packages', {
    method: 'POST',
    body: JSON.stringify(packageData),
  }),

  // ส่งประกาศ Broadcast พัสดุไม่ทราบชื่อขึ้นบอร์ดกลาง
  broadcastPackage: (broadcastData) => apiFetch('/api/packages/broadcast', {
    method: 'POST',
    body: JSON.stringify(broadcastData),
  }),

  // เจ้าหน้าที่จับคู่นักศึกษากับพัสดุด้วยตนเอง (Manual Match)
  manualMatchPackage: (tracking, studentId) => apiFetch(`/api/packages/${tracking}/match`, {
    method: 'PUT',
    body: JSON.stringify({ student_id: studentId }),
  }),

  // รีเซ็ตฐานข้อมูลพัสดุกลับสู่ค่าเริ่มต้น
  resetDatabase: () => apiFetch('/api/packages/reset', {
    method: 'POST',
  }),
};
