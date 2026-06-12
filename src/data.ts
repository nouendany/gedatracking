import { Employee, AttendanceRecord } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    nameKh: "ស៊ិន ស៊ីសាមុត",
    nameEn: "Sin Sisamouth",
    position: "ប្រធានបច្ចេកវិទ្យា (CTO)",
    department: "ផ្នែកបច្ចេកវិទ្យា (IT)",
    phone: "012 345 678",
    email: "sisamouth.sin@company.com",
    avatarColor: "bg-blue-600",
    workTime: "08:00",
    joinedDate: "2024-01-15"
  },
  {
    id: "EMP-002",
    nameKh: "កែវ សារ៉ាត់",
    nameEn: "Keo Sarath",
    position: "អ្នកអភិវឌ្ឍន៍ជំនាញ (Senior Developer)",
    department: "ផ្នែកបច្ចេកវិទ្យា (IT)",
    phone: "015 999 888",
    email: "sarath.keo@company.com",
    avatarColor: "bg-emerald-600",
    workTime: "08:00",
    joinedDate: "2024-06-10"
  },
  {
    id: "EMP-003",
    nameKh: "ម៉េង កែវពេជ្ជតា",
    nameEn: "Meng Keopichda",
    position: "ប្រធានធនធានមនុស្ស (HR Manager)",
    department: "ផ្នែកធនធានមនុស្ស (HR)",
    phone: "099 777 666",
    email: "keopichda.meng@company.com",
    avatarColor: "bg-fuchsia-600",
    workTime: "08:30",
    joinedDate: "2023-11-01"
  },
  {
    id: "EMP-004",
    nameKh: "ណយ វ៉ាន់ណេត",
    nameEn: "Noy Vanneth",
    position: "អ្នកគ្រប់គ្រងគណនេយ្យ (Accountant)",
    department: "ផ្នែកហិរញ្ញវត្ថុ (Finance)",
    phone: "088 555 444",
    email: "vanneth.noy@company.com",
    avatarColor: "bg-amber-600",
    workTime: "08:00",
    joinedDate: "2024-03-20"
  },
  {
    id: "EMP-005",
    nameKh: "មាស សុខសោភា",
    nameEn: "Meas Soksophea",
    position: "អ្នករចនាគេហទំព័រ (UI/UX Designer)",
    department: "ផ្នែករចនា (Creative Design)",
    phone: "077 111 222",
    email: "soksophea.meas@company.com",
    avatarColor: "bg-rose-600",
    workTime: "08:30",
    joinedDate: "2025-01-05"
  },
  {
    id: "EMP-006",
    nameKh: "ព្រាប សុវត្ថិ",
    nameEn: "Preap Sovath",
    position: "ប្រធានផ្នែកទីផ្សារ (Marketing Lead)",
    department: "ផ្នែកទីផ្សារ (Marketing)",
    phone: "093 222 333",
    email: "sovath.preap@company.com",
    avatarColor: "bg-violet-600",
    workTime: "08:00",
    joinedDate: "2024-09-15"
  }
];

// Helper to generate a UUID-like simple ID
export function generateId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Generate realistic attendance logs for the past N days
export function generatePastAttendance(employees: Employee[], daysCount: number = 30): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = daysCount; i >= 1; i--) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() - i);
    
    // Skip future dates if somehow we compute them
    if (curDate > today) continue;
    
    const dayOfWeek = curDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    
    if (isWeekend) {
      continue; // Skip weekend logs by default
    }
    
    const dateString = curDate.toISOString().split('T')[0];
    
    employees.forEach(emp => {
      // 90% attendance chance
      const rand = Math.random();
      
      if (rand > 0.08) { // Present
        const isLate = Math.random() < 0.15; // 15% late chance
        
        let checkInHour = parseInt(emp.workTime.split(':')[0]);
        let checkInMinute = parseInt(emp.workTime.split(':')[1]);
        
        let checkInStr = "";
        let status: 'present' | 'late' | 'absent' = 'present';
        
        if (isLate) {
          status = 'late';
          // Late by 5 to 45 mins
          const lateMins = Math.floor(Math.random() * 40) + 5;
          const totalInMins = checkInHour * 60 + checkInMinute + lateMins;
          const h = Math.floor(totalInMins / 60);
          const m = totalInMins % 60;
          const s = Math.floor(Math.random() * 60);
          checkInStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        } else {
          // On time: arrived 30 mins early or exactly on time
          const earlyMins = Math.floor(Math.random() * 25);
          const totalInMins = checkInHour * 60 + checkInMinute - earlyMins;
          const h = Math.floor(totalInMins / 60);
          const m = totalInMins % 60;
          const s = Math.floor(Math.random() * 60);
          checkInStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        
        // Checkout between 17:00 and 18:30
        const outH = 17 + Math.floor(Math.random() * 2);
        const outM = Math.floor(Math.random() * 60);
        const outS = Math.floor(Math.random() * 60);
        const checkOutStr = `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}:${String(outS).padStart(2, '0')}`;
        
        records.push({
          id: `REC-${generateId()}`,
          employeeId: emp.id,
          date: dateString,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          status,
          notes: isLate ? "ផ្ទុកការងារមមាញឹក រឺស្ទះចរាចរណ៍" : undefined
        });
      } else {
        // Absent: 8% chance can be unpaid leave or sick
        records.push({
          id: `REC-${generateId()}`,
          employeeId: emp.id,
          date: dateString,
          checkIn: null,
          checkOut: null,
          status: 'absent',
          notes: Math.random() > 0.5 ? "សុំច្បាប់ផ្ទាល់ตัว" : "សុំច្បាប់ឈឺ"
        });
      }
    });
  }
  
  return records;
}
