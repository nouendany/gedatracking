export interface Employee {
  id: string;
  nameKh: string;
  nameEn: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  avatarColor: string;
  workTime: string; // Target starting time, e.g. "08:00"
  joinedDate: string; // YYYY-MM-DD
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm:ss
  checkOut: string | null; // HH:mm:ss
  status: 'present' | 'late' | 'absent';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: 'annual' | 'sick' | 'personal' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DayStatus {
  date: string; // YYYY-MM-DD
  status: 'all-present' | 'partial' | 'weekend' | 'none';
}
