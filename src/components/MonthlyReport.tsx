import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { 
  Calendar, 
  Download, 
  Search, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet,
  Settings
} from 'lucide-react';

interface MonthlyReportProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
}

export default function MonthlyReport({
  employees,
  attendanceRecords
}: MonthlyReportProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Expanded employees row listing for daily log details
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  const monthsList = [
    { value: 1, label: "មករា (January)", days: 31 },
    { value: 2, label: "កុម្ភៈ (February)", days: 28 }, // Leap years simplified
    { value: 3, label: "មីនា (March)", days: 31 },
    { value: 4, label: "មេសា (April)", days: 30 },
    { value: 5, label: "ឧសភា (May)", days: 31 },
    { value: 6, label: "មិថុនា (June)", days: 30 },
    { value: 7, label: "កក្កដា (July)", days: 31 },
    { value: 8, label: "សីហា (August)", days: 31 },
    { value: 9, label: "កញ្ញា (September)", days: 30 },
    { value: 10, label: "តុលា (October)", days: 31 },
    { value: 11, label: "វិច្ឆិកា (November)", days: 30 },
    { value: 12, label: "ធ្នូ (December)", days: 31 }
  ];

  // Leap year adjustment
  const totalDaysInMonth = useMemo(() => {
    const m = monthsList.find(x => x.value === selectedMonth);
    if (selectedMonth === 2) {
      const isLeap = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
      return isLeap ? 29 : 28;
    }
    return m ? m.days : 30;
  }, [selectedMonth, selectedYear]);

  // Compute working days in selected month (excluding weekends Sat/Sun)
  const workingDaysInMonth = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // skip Sunday (0) and Saturday (6)
        count++;
      }
    }
    return count;
  }, [selectedMonth, selectedYear, totalDaysInMonth]);

  // Filter attendance records to the selected month and year
  const filteredRecords = useMemo(() => {
    const formattedPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return attendanceRecords.filter(rec => rec.date.startsWith(formattedPrefix));
  }, [attendanceRecords, selectedMonth, selectedYear]);

  // Aggregate stats per employee for the table
  const employeeStats = useMemo(() => {
    return employees.map(emp => {
      // Find all records for this employee in the filtered list
      const records = filteredRecords.filter(rec => rec.employeeId === emp.id);
      
      const presents = records.filter(rec => rec.checkIn !== null && rec.status !== 'absent').length;
      const lates = records.filter(rec => rec.status === 'late').length;
      
      // Compute absents:
      // An absent is logged either explicitly as 'absent' OR represents a working day where no record exists (yet/or was entirely skipped)
      // For retrospective reporting, we count explicit absent records + missing working days
      const explicitAbsents = records.filter(rec => rec.status === 'absent').length;
      
      // Attendance percentage: Presents divided by total logs or working days
      // Let's make a beautiful relative KPI score out of 100
      const possibleDays = workingDaysInMonth || 22;
      const actualPresents = presents;
      const attPercent = Math.min(100, Math.round((actualPresents / possibleDays) * 100));

      const absents = Math.max(0, possibleDays - presents);

      return {
        employee: emp,
        presents,
        lates,
        absents,
        attendanceRate: attPercent,
        rawRecords: records
      };
    });
  }, [employees, filteredRecords, workingDaysInMonth]);

  // General department averages
  const generalSummary = useMemo(() => {
    if (employeeStats.length === 0) return { avgAtt: 0, totalPresents: 0, totalLates: 0, totalAbsents: 0 };
    const totalP = employeeStats.reduce((acc, cr) => acc + cr.presents, 0);
    const totalL = employeeStats.reduce((acc, cr) => acc + cr.lates, 0);
    const totalA = employeeStats.reduce((acc, cr) => acc + cr.absents, 0);
    const sumRate = employeeStats.reduce((acc, cr) => acc + cr.attendanceRate, 0);
    const avgRate = Math.round(sumRate / employeeStats.length);

    return {
      avgAtt: avgRate,
      totalPresents: totalP,
      totalLates: totalL,
      totalAbsents: totalA
    };
  }, [employeeStats]);

  // Filtered list of search results
  const searchedEmployeeStats = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employeeStats.filter(item => 
      item.employee.nameKh.toLowerCase().includes(term) ||
      item.employee.nameEn.toLowerCase().includes(term) ||
      item.employee.id.toLowerCase().includes(term) ||
      item.employee.position.toLowerCase().includes(term)
    );
  }, [employeeStats, searchTerm]);

  // EXPORT THE FULL REPORT TO CSV
  const handleExportCSV = () => {
    const m = monthsList.find(x => x.value === selectedMonth);
    const monthLabel = m ? m.label.split(' ')[0] : `${selectedMonth}`;
    
    // Add UTF-8 Byte Order Mark (BOM) to support Khmer characters properly in Microsoft Excel!
    let csvContent = "\uFEFF";
    
    // CSV Header section
    csvContent += `"របាយការណ៍អវត្តមានបុគ្គលិកប្រចាំខែ", "${monthLabel}/${selectedYear}"\n`;
    csvContent += `"ចំនួនថ្ងៃធ្វើការសរុប", "${workingDaysInMonth} ថ្ងៃ"\n\n`;
    
    // Table Headers
    csvContent += `"លេខសម្គាល់បុគ្គលិក","ឈ្មោះជាខ្មែរ","ឈ្មោះជាអង់គ្លេស","តួនាទី","ផ្នែក","ថ្ងៃវត្តមានសរុប (ថ្ងៃ)","ចំនួនយឺត (ដង)","អវត្តមានសរុប (ថ្ងៃ)","អត្រាវត្តមាន (%)"\n`;
    
    // Table Rows
    employeeStats.forEach(row => {
      csvContent += `"${row.employee.id}","${row.employee.nameKh}","${row.employee.nameEn}","${row.employee.position}","${row.employee.department}","${row.presents}","${row.lates}","${row.absents}","${row.attendanceRate}%"\n`;
    });

    // Create blobs and trigger triggers download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Monthly_Attendance_Report_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpand = (id: string) => {
    setExpandedEmpId(expandedEmpId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Search and Period Picker Panel */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 self-start md:self-auto">
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">របាយការណ៍ប្រចាំខែ</h2>
          <p className="text-sm text-slate-500">ជ្រើសរើសខែ/ឆ្នាំ ដើម្បីទាញយកទិន្នន័យអវត្តមាន និងវត្តមានជា Excel/CSV</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          {/* Month Picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-hidden font-medium flex-1 sm:w-44 text-slate-700 bg-white"
            >
              {monthsList.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          {/* Year Picker */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-hidden font-medium w-full sm:w-28 text-slate-700 bg-white"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0 active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ទាញយក Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Overview Stats for this month */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Month Total Days */}
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ថ្ងៃការងារសរុបក្នុងខែ</span>
          <span className="text-xl font-extrabold text-indigo-700 block">{workingDaysInMonth} ថ្ងៃ</span>
          <p className="text-[10px] text-slate-400 font-medium">ច័ន្ទ ដល់ សុក្រ (មិនគិតចុងសប្តាហ៍)</p>
        </div>

        {/* KPI 2: Avg Attendance */}
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">អត្រាវត្តមានមធ្យម</span>
          <span className="text-xl font-extrabold text-emerald-600 block">{generalSummary.avgAtt}%</span>
          <p className="text-[10px] text-slate-400 font-medium">មធ្យមភាគបុគ្គលិកទាំងអស់</p>
        </div>

        {/* KPI 3: Late Hits */}
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ចំនួនយឺតសរុប (ដង)</span>
          <span className="text-xl font-extrabold text-amber-600 block">{generalSummary.totalLates} ដង</span>
          <p className="text-[10px] text-slate-400 font-medium">វត្តមានក្រោយម៉ោងដែលបានកំណត់</p>
        </div>

        {/* KPI 4: Absent Hits */}
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ចំនួនខកខានសរុប</span>
          <span className="text-xl font-extrabold text-red-500 block">{generalSummary.totalAbsents} ថ្ងៃ</span>
          <p className="text-[10px] text-slate-400 font-medium">អវត្តមានពិតប្រាកដ ឬមិនបានស្កេន</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        {/* Table Toolbar Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">បញ្ជីវត្តមានបុគ្គលិកប្រចាំខែ</span>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះបុគ្គលិក..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">ឈ្មោះបុគ្គលិក</th>
                <th className="py-3 px-5">តួនាទី</th>
                <th className="py-3 px-5 text-center">វត្តមាន (ថ្ងៃ)</th>
                <th className="py-3 px-5 text-center">វត្តមានយឺត (ដង)</th>
                <th className="py-3 px-5 text-center">អវត្តមាន (ថ្ងៃ)</th>
                <th className="py-3 px-5 text-center">អត្រាវត្តមាន (%)</th>
                <th className="py-3 px-5 text-right">កំណត់ត្រាលម្អិត</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {searchedEmployeeStats.map((row) => {
                const isExpanded = expandedEmpId === row.employee.id;
                
                return (
                  <React.Fragment key={row.employee.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-400">{row.employee.id}</td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800 text-sm">{row.employee.nameKh}</div>
                        <div className="text-[10px] text-slate-400 font-medium italic">{row.employee.nameEn}</div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{row.employee.position}</td>
                      <td className="py-3.5 px-5 text-center font-bold text-emerald-600">{row.presents} ថ្ងៃ</td>
                      <td className="py-3.5 px-5 text-center font-bold text-amber-500">{row.lates} ដង</td>
                      <td className="py-3.5 px-5 text-center font-bold text-red-500">{row.absents} ថ្ងៃ</td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="inline-flex px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                          {row.attendanceRate}%
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => toggleExpand(row.employee.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/60 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          <span>{isExpanded ? "បិទវិញ" : "មើលលម្អិត"}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expaned calendar daily logs row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-indigo-100">
                        <td colSpan={8} className="p-4 bg-indigo-50/10">
                          <div className="bg-white rounded-xl p-4 border border-indigo-100/50 shadow-inner">
                            <h4 className="font-bold text-slate-800 text-xs mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                              <Settings className="w-4 h-4 text-indigo-500" />
                              <span>កំណត់ត្រាស្កេនលម្អិតសម្រាប់៖ <b className="text-indigo-700 font-extrabold">{row.employee.nameKh}</b> ({row.employee.id})</span>
                            </h4>

                            {row.rawRecords.length === 0 ? (
                              <p className="text-slate-400 text-xs italic py-2 text-center">មិនទាន់មានកំណត់ត្រាស្កេនសម្រាប់ការិយាល័យក្នុងខែនេះនៅឡើយទេ។</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                                {row.rawRecords.sort((a,b) => b.date.localeCompare(a.date)).map((rec) => (
                                  <div 
                                    key={rec.id} 
                                    className="p-3 bg-white border border-slate-100 rounded-lg shadow-2xs flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <span className="text-[11px] font-bold text-slate-700 block">{rec.date}</span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">
                                        ចូល៖ <strong className="text-slate-700 font-mono">{rec.checkIn || '---'}</strong> | 
                                        ចេញ៖ <strong className="text-slate-700 font-mono">{rec.checkOut || '---'}</strong>
                                      </span>
                                    </div>

                                    {/* Action tags */}
                                    {rec.status === 'late' ? (
                                      <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">
                                        យឺត
                                      </span>
                                    ) : rec.status === 'absent' ? (
                                      <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase">
                                        ច្បាប់ / អវត្តមាន
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                                        ទាន់ពេល
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
