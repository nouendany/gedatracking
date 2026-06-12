import { useMemo } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { 
  Users, 
  UserCheck, 
  Clock, 
  UserX, 
  Activity, 
  TrendingUp, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface DashboardOverviewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onSetTab: (tabName: 'dashboard' | 'scan' | 'directory' | 'report') => void;
}

export default function DashboardOverview({
  employees,
  attendanceRecords,
  onSetTab
}: DashboardOverviewProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today stats computation
  const stats = useMemo(() => {
    const total = employees.length;
    
    // Records logged for today
    const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
    
    const checkedInCount = todayRecords.filter(r => r.checkIn !== null).length;
    const lateCount = todayRecords.filter(r => r.status === 'late').length;
    const absentCount = total - checkedInCount; // Absent or not checked in yet
    
    return {
      total,
      checkedIn: checkedInCount,
      late: lateCount,
      absent: absentCount >= 0 ? absentCount : 0
    };
  }, [employees, attendanceRecords, todayStr]);

  // Activity feed for today (merged scans sorted by time descending)
  const todayActivities = useMemo(() => {
    const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
    
    interface ActivityItem {
      id: string;
      employee: Employee;
      time: string;
      type: 'in' | 'out';
      status: 'present' | 'late' | 'out' | 'absent';
      notes?: string;
    }
    
    const list: ActivityItem[] = [];
    
    todayRecords.forEach(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      if (!emp) return;
      
      if (rec.checkIn) {
        list.push({
          id: `${rec.id}-in`,
          employee: emp,
          time: rec.checkIn,
          type: 'in',
          status: rec.status,
          notes: rec.notes
        });
      }
      if (rec.checkOut) {
        list.push({
          id: `${rec.id}-out`,
          employee: emp,
          time: rec.checkOut,
          type: 'out',
          status: 'out'
        });
      }
    });
    
    // Sort activities by time descending (newest first)
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [employees, attendanceRecords, todayStr]);

  // Chart data generation of past 7 calendar working days
  const chartData = useMemo(() => {
    const weekDays: string[] = [];
    const today = new Date();
    
    // Collect the past 7 days excluding weekends
    for (let i = 8; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // skip weekends
        weekDays.push(d.toISOString().split('T')[0]);
      }
    }

    // Capture the last 5 active working days to put on x-axis
    const last5 = weekDays.slice(-5);
    
    return last5.map(dateString => {
      const d = new Date(dateString);
      // Day names in Khmer
      const daysKh = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
      const dayLabel = `${daysKh[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;
      
      const dayRecords = attendanceRecords.filter(r => r.date === dateString);
      
      const present = dayRecords.filter(r => r.checkIn !== null && r.status !== 'absent').length;
      const late = dayRecords.filter(r => r.status === 'late').length;
      const absent = dayRecords.filter(r => r.status === 'absent').length;
      
      return {
        name: dayLabel,
        "វត្តមានទាន់ពេល (On Time)": present - late,
        "វត្តមានយឺត (Late)": late,
        "អវត្តមាន (Absent)": absent === 0 && dayRecords.length === 0 ? employees.length : absent
      };
    });
  }, [attendanceRecords, employees]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-indigo-700 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Decorative backdrop blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-5" />
        
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black font-sans tracking-tight">សួស្តី! ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងអវត្តមាន</h1>
          <p className="text-indigo-100 text-xs md:text-sm">ប្រព័ន្ធឆ្លាតវៃសម្រាប់ចុះវត្តមានបុគ្គលឹកប្រចាំថ្ងៃតាម QR Code និងទាញយករបាយការណ៍</p>
        </div>
        
        <button
          onClick={() => onSetTab('scan')}
          className="bg-white hover:bg-slate-50 text-indigo-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-98"
        >
          <span>បើកម៉ាស៊ីនស្កេន</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">បុគ្គលឹកសរុប</span>
            <div className="text-2xl font-black text-slate-800">{stats.total} នាក់</div>
            <p className="text-[10px] text-slate-400">គណនីបុគ្គលិកសកម្ម</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Checked-In */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">បានស្កេនចូលថ្ងៃនេះ</span>
            <div className="text-2xl font-black text-emerald-600">{stats.checkedIn} នាក់</div>
            <p className="text-[10px] text-emerald-500 font-medium">ស្មើនឹង {stats.total ? Math.round((stats.checkedIn / stats.total) * 100) : 0}% នៃសរុប</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Late */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">វត្តមានយឺតថ្ងៃនេះ</span>
            <div className="text-2xl font-black text-amber-600">{stats.late} នាក់</div>
            <p className="text-[10px] text-amber-500">ស្កេនក្រោយម៉ោងកំណត់</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Absent */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">អវត្តមាន / មិនទាន់ស្កេន</span>
            <div className="text-2xl font-black text-red-500">{stats.absent} នាក់</div>
            <p className="text-[10px] text-red-400">មិនទាន់មានវត្តមានថ្ងៃនេះ</p>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts & Live Streams layout (Split grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>ប្រវត្តិនៃការចុះវត្តមាន ៥ ថ្ងៃចុងក្រោយ</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">ស្ថិតិប្រៀបធៀបវត្តមានទាន់ពេល វត្តមានយឺត និងបុគ្គលិកអវត្តមាន</p>
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Bar dataKey="វត្តមានទាន់ពេល (On Time)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} stackId="a" />
                <Bar dataKey="វត្តមានយឺត (Late)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} stackId="a" />
                <Bar dataKey="អវត្តមាន (Absent)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Scan Feeds (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col h-full max-h-[360px] overflow-hidden">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between shrink-0">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
              <span>សកម្មភាពស្កេនថ្ងៃនេះ</span>
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {todayActivities.length} សកម្មភាព
            </span>
          </div>

          {/* Activities list */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
            {todayActivities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-2">
                <span className="text-3xl">☕</span>
                <p className="text-sm text-slate-500 font-medium">មិនទាន់មានការស្កេនវត្តមានថ្ងៃនេះនៅឡើយទេ</p>
                <p className="text-slate-400 text-xs">សូមបើកផ្ទាំងស្កេន QR ខាងលើ ដើម្បីសាកល្បងចុះវត្តមានបុគ្គលិកដំបូងបង្អស់។</p>
              </div>
            ) : (
              todayActivities.map((act) => (
                <div key={act.id} className="flex gap-3 hover:bg-slate-50/50 p-1.5 rounded-xl transition-colors">
                  {/* Avatar Initials with custom background */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 mt-0.5 ${act.employee.avatarColor || 'bg-slate-500'}`}>
                    {act.employee.nameEn.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  
                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate" title={act.employee.nameKh}>
                        {act.employee.nameKh}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
                        {act.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 gap-2">
                      <span className="truncate">{act.employee.position}</span>
                      
                      {/* Check In vs Check Out badge */}
                      {act.type === 'in' ? (
                        act.status === 'late' ? (
                          <span className="text-[10px] font-bold text-amber-600 shrink-0">
                            ចូលធ្វើការ (យឺត)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                            ចូលធ្វើការ (ទាន់ពេល)
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 shrink-0">
                          ចេញទៅផ្ទះ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
