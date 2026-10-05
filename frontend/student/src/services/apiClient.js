/**
 * API Client Service Layer (Task 16.2 - Student UI)
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
 * Services สำหรับ Student UI
 */
export const studentApi = {
  // ดึงรายการพัสดุทั้งหมด
  getPackages: () => apiFetch('/api/packages'),

  // ดึงรายการพัสดุที่ไม่ทราบชื่อที่ขึ้นประกาศในบอร์ดกลาง (Broadcast Board - FR-04)
  getBroadcasts: () => apiFetch('/api/packages/broadcasts'),

  // ยืนยันการเซ็นรับพัสดุดิจิทัล (Digital Signature - FR-05)
  receivePackage: (pkgId, signatureData, studentId) => apiFetch(`/api/packages/${pkgId}/receive`, {
    method: 'PUT',
    body: JSON.stringify({
      signature_data: signatureData,
      student_id: studentId,
    }),
  }),

  // นักศึกษาแจ้งสิทธิ์ความเป็นเจ้าของพัสดุไม่ทราบชื่อ (Claim Package - FR-04)
  claimPackage: (pkgId, claimedBy, claimProof, studentId) => apiFetch(`/api/packages/${pkgId}/claim`, {
    method: 'PUT',
    body: JSON.stringify({
      claimed_by: claimedBy,
      claim_proof: claimProof,
      student_id: studentId,
    }),
  }),

  // ดึงประวัติการแจ้งเตือนของนักศึกษาจาก MongoDB (Task 12)
  getNotifications: (studentId) => apiFetch(`/api/notifications/student/${studentId}`),

  // รีเซ็ตฐานข้อมูลพัสดุกลับสู่ค่าเริ่มต้น
  resetDatabase: () => apiFetch('/api/packages/reset', {
    method: 'POST',
  }),
};
