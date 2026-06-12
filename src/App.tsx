import { useState, useEffect } from 'react';
import { Employee, AttendanceRecord } from './types';
import { INITIAL_EMPLOYEES, generatePastAttendance } from './data';
import DashboardOverview from './components/DashboardOverview';
import SQRScanner from './components/SQRScanner';
import EmployeeDirectory from './components/EmployeeDirectory';
import MonthlyReport from './components/MonthlyReport';
import { 
  BarChart3, 
  QrCode, 
  Users, 
  FileSpreadsheet, 
  Calendar, 
  Clock,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'directory' | 'report'>('dashboard');

  // Load / Store State in LocalStorage for reliable local persistence
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const local = localStorage.getItem('qr_attendance_employees');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (err) {
        console.error("Local storage employee load failure:", err);
      }
    }
    return INITIAL_EMPLOYEES;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const local = localStorage.getItem('qr_attendance_logs');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (err) {
        console.error("Local storage attendance load failure:", err);
      }
    }
    // Pre-populate with 30 days of high quality statistics
    return generatePastAttendance(INITIAL_EMPLOYEES, 30);
  });

  // Clock updates ticking for Real-Time look
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save states back to local storage
  useEffect(() => {
    localStorage.setItem('qr_attendance_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('qr_attendance_logs', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // Handlers for Employees
  const handleAddEmployee = (emp: Employee) => {
    setEmployees(prev => [emp, ...prev]);
  };

  const handleEditEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    // Also if workTime updated, might need updating future calculations
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    // Keep attendance database records to avoid orphan data breaks
  };

  // Handlers for Attendance
  const handleAddAttendance = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      // If the employee already has a record for this specific day, we replace it (e.g. they checked in, now checking out!)
      const index = prev.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
      if (index !== -1) {
        const copy = [...prev];
        copy[index] = record;
        return copy;
      }
      return [record, ...prev];
    });
  };

  // Khmer Formatted Date helper
  const getKhmerDateString = (d: Date) => {
    const daysKh = ['ថ្ងៃអាទិត្យ', 'ថ្ងៃច័ន្ទ', 'ថ្ងៃអង្គារ', 'ថ្ងៃពុធ', 'ថ្ងៃព្រហស្បតិ៍', 'ថ្ងៃសុក្រ', 'ថ្ងៃសៅរ៍'];
    const monthsKh = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    
    // Simple Khmer digits converter
    const toKhmerDigits = (num: number | string) => {
      const regex = /[0-9]/g;
      const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      return String(num).replace(regex, (digit) => khmerDigits[parseInt(digit)]);
    };

    const dayName = daysKh[d.getDay()];
    const dateNum = toKhmerDigits(d.getDate());
    const monthName = monthsKh[d.getMonth()];
    const yearNum = toKhmerDigits(d.getFullYear());

    return `${dayName} ទី${dateNum} ខែ${monthName} ឆ្នាំ${yearNum}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. APP NAVBAR HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-2xs backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Branding Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <QrCode className="w-6 h-6 animate-[pulse_3s_infinite]" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-black text-slate-800 font-heading tracking-tight leading-none">
                  GEDA TRACKING
                </h1>
              </div>
            </div>

            {/* Live Clock Widget */}
            <div className="hidden md:flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
              <Clock className="w-5 h-5 text-indigo-500 animate-spin-slow shrink-0" />
              <div className="text-right">
                <span className="font-mono text-base font-bold text-slate-700 block tracking-wider leading-none">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  {getKhmerDateString(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION TOP METRO TABS BAR */}
      <nav className="bg-white border-b border-slate-100/80 sticky top-20 z-30 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start md:justify-center overflow-x-auto gap-4 py-3 shrink-0 scrollbar-none">
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>ផ្ទាំងគ្រប់គ្រង (Dashboard)</span>
            </button>

            {/* Tab 2: Scan QR */}
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'scan' ? 'bg-indigo-600 text-white shadow-sm font-black scale-102 ring-2 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>ស្កេន QR កូដ (Scan QR)</span>
            </button>

            {/* Tab 3: Employees */}
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>បញ្ជីបុគ្គលឹក (Staff List)</span>
            </button>

            {/* Tab 4: Report */}
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>របាយការណ៍ (Monthly Report)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 3. MAIN WORKPLACE ROUTER CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <DashboardOverview 
              employees={employees} 
              attendanceRecords={attendanceRecords} 
              onSetTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'scan' && (
            <SQRScanner 
              employees={employees} 
              attendanceRecords={attendanceRecords} 
              onAddAttendance={handleAddAttendance} 
            />
          )}

          {activeTab === 'directory' && (
            <EmployeeDirectory 
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onEditEmployee={handleEditEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === 'report' && (
            <MonthlyReport 
              employees={employees}
              attendanceRecords={attendanceRecords}
            />
          )}
        </div>
      </main>

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center mt-12 text-xs text-slate-400 font-sans space-y-1.5 shrink-0">
        <div className="font-bold text-slate-500">GEDA TRACKING (QR-Attendance Tracking Suite)</div>
        <div>
          ប្រព័ន្ធចុះវត្តមានទូរស័ព្ទ និងទាញយករបាយការណ៍ប្រចាំខែយ៉ាងងាយស្រួល សម្រួលដល់មន្ត្រីធនធានមនុស្ស។
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          អភិវឌ្ឍន៍ដោយ៖ <strong className="text-indigo-600 font-bold">NOUEN Dany</strong> (ទូរស័ព្ទ៖ <a href="tel:010955536" className="hover:underline text-slate-600">010 955 536</a>)
        </div>
        <div className="text-[10px] text-slate-300 font-medium">
          រក្សាសិទ្ធិគ្រប់យ៉ាង © ២០២៦
        </div>
      </footer>
    </div>
  );
}
