import { useEffect, useState, useRef } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  ToggleLeft, 
  UserCheck, 
  LogOut, 
  AlertCircle, 
  RefreshCcw, 
  Sparkles, 
  Smartphone,
  CheckCircle,
  HelpCircle,
  Play,
  Clock,
  IdCard
} from 'lucide-react';

interface SQRScannerProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onAddAttendance: (record: AttendanceRecord) => void;
}

export default function SQRScanner({
  employees,
  attendanceRecords,
  onAddAttendance
}: SQRScannerProps) {
  // 'in' = Check In, 'out' = Check Out
  const [scanType, setScanType] = useState<'in' | 'out'>('in');
  const [selectedSimulateEmp, setSelectedSimulateEmp] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Custom success screen
  const [successScan, setSuccessScan] = useState<{
    employee: Employee;
    record: AttendanceRecord;
    type: 'in' | 'out';
  } | null>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const readerId = "qr-reader-viewport";

  // Web Audio chime builder for delightful scans
  const playChime = (isSuccess: boolean = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, start: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      const now = audioCtx.currentTime;
      if (isSuccess) {
        // High, double modern notification chime
        playNote(587.33, now, 0.12); // D5
        playNote(880, now + 0.1, 0.25); // A5
      } else {
        // Low cautionary double buzzer
        playNote(150, now, 0.15, 'triangle');
        playNote(150, now + 0.18, 0.15, 'triangle');
      }
    } catch (err) {
      console.warn("Audio Context failed to play chime (browser security limits):", err);
    }
  };

  // Set default simulation employee
  useEffect(() => {
    if (employees.length > 0 && !selectedSimulateEmp) {
      setSelectedSimulateEmp(employees[0].id);
    }
  }, [employees, selectedSimulateEmp]);

  // Request cameras on mount or tab focus
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Auto select first camera
          setActiveCameraId(devices[0].id);
        } else {
          setCameraError("រកមិនឃើញកាមេរ៉ាក្នុងឧបករណ៍របស់អ្នកឡើយ។");
        }
      })
      .catch(err => {
        console.warn("Failed to retrieve cameras (probably inside nested iframe sandboxing):", err);
        setCameraError("ប្រព័ន្ធកាត់ផ្តាច់សិទ្ធិមើលកាមេរ៉ា (Iframe Sandbox Permission)។ សូមប្រើសេវាកម្ម 'ស្កេនសាកល្បង' ជំនួសវិញ។");
      });

    return () => {
      stopCameraScan();
    };
  }, []);

  // Handle actual QR Success scan
  const handleQRReadSuccess = (decodedText: string) => {
    // Look up employee by ID
    const emp = employees.find(e => e.id.trim() === decodedText.trim());
    if (emp) {
      stopCameraScan();
      triggerAttendanceMark(emp);
    } else {
      // Unknown QR code
      playChime(false);
      alert(`ស្កេនបានកូដ៖ "${decodedText}" ប៉ុន្តែមិនមានក្នុងបញ្ជីបុគ្គលិកឡើយ!`);
    }
  };

  // Stop camera scan helper
  const stopCameraScan = async () => {
    if (qrReaderRef.current && qrReaderRef.current.isScanning) {
      try {
        await qrReaderRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Stop camera error:", err);
      }
    }
  };

  // Start scanning
  const startCameraScan = async () => {
    if (!activeCameraId) {
      alert("សូមជ្រើសរើសកាមេរ៉ាមុននឹងបើកការស្កេន!");
      return;
    }
    setCameraError(null);
    setIsScanning(true);

    try {
      const html5Qrcode = new Html5Qrcode(readerId);
      qrReaderRef.current = html5Qrcode;

      await html5Qrcode.start(
        activeCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleQRReadSuccess(decodedText);
        },
        (errorMessage) => {
          // Silent: trigger error logs excessively
        }
      );
    } catch (err: any) {
      console.error("Camera scanner failed to start:", err);
      setCameraError(`មិនអាចបើកកាមេរ៉ាបានទេ៖ ${err.message || err}. សូមប្រាកដថាអ្នកបានផ្តល់សិទ្ធិប្រើប្រាស់ Camera!`);
      setIsScanning(false);
    }
  };

  // Trigger attendance logging
  const triggerAttendanceMark = (emp: Employee) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false }); // "HH:MM:SS"
    
    // Check if employee already checked in/out for today
    const existingRecordIndex = attendanceRecords.findIndex(
      rec => rec.employeeId === emp.id && rec.date === todayStr
    );

    let finalRecord: AttendanceRecord;

    if (scanType === 'in') {
      // If already checked in
      if (existingRecordIndex !== -1 && attendanceRecords[existingRecordIndex].checkIn) {
        playChime(false);
        alert(`បុគ្គលិកឈ្មោះ "${emp.nameKh}" បានចុះវត្តមាន 'ចូលខ្ទង់' រួចរាល់ហើយសម្រាប់ថ្ងៃនេះ!`);
        return;
      }

      // Check "late" status
      const [targetH, targetM] = emp.workTime.split(':').map(Number);
      const [nowH, nowM] = timeNow.split(':').map(Number);
      
      let status: 'present' | 'late' | 'absent' = 'present';
      if (nowH > targetH || (nowH === targetH && nowM > targetM)) {
        status = 'late';
      }

      finalRecord = {
        id: `REC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        employeeId: emp.id,
        date: todayStr,
        checkIn: timeNow,
        checkOut: null,
        status,
        notes: status === 'late' ? "បានចុះវត្តមានយឺតជាងពេលកំណត់" : "បានចុះវត្តមានធម្មតា"
      };
    } else {
      // CHECK OUT
      if (existingRecordIndex === -1) {
        // Did not check in yet
        playChime(false);
        alert(`ការព្រមាន៖ បុគ្គលិក "${emp.nameKh}" មិនទាន់បានស្កេន 'ចូល' ធ្វើការនៅឡើយទេសម្រាប់ថ្ងៃនេះ! ប្រព័ន្ធនឹងកត់ត្រាការចេញតែម្តង។`);
        
        finalRecord = {
          id: `REC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          employeeId: emp.id,
          date: todayStr,
          checkIn: null,
          checkOut: timeNow,
          status: 'present',
          notes: "ចុះវត្តមានចេញដោយគ្មានការស្កេនចូល"
        };
      } else {
        // Update existing record with check-out
        const existing = attendanceRecords[existingRecordIndex];
        finalRecord = {
          ...existing,
          checkOut: timeNow
        };
      }
    }

    onAddAttendance(finalRecord);
    playChime(true);
    setSuccessScan({
      employee: emp,
      record: finalRecord,
      type: scanType
    });

    // Auto dismiss success screen after 5 seconds
    const timer = setTimeout(() => {
      setSuccessScan(null);
    }, 5000);

    return () => clearTimeout(timer);
  };

  // Simulate scanning of custom chosen employee
  const handleSimulateScan = () => {
    if (!selectedSimulateEmp) {
      alert("សូមជ្រើសរើសបុគ្គលិកណាម្នាក់សម្រាប់ធ្វើការសាកល្បង!");
      return;
    }
    const emp = employees.find(e => e.id === selectedSimulateEmp);
    if (emp) {
      triggerAttendanceMark(emp);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* SUCCESS POPUP MODAL (overlay) */}
      {successScan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-2 border-emerald-500 shadow-2xl relative overflow-hidden animate-scale-up">
            {/* Top decorative ripple ring */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-emerald-50 to-white -z-10" />
            
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2">
              {successScan.type === 'in' ? 'ចុះវត្តមាន៖ ចូលធ្វើការ (CHECK IN)' : 'ចុះវត្តមាន៖ ចេញត្រឡប់ (CHECK OUT)'}
            </span>

            <h2 className="text-2xl font-black text-slate-800">ស្កេនវត្តមានបានជោគជ័យ!</h2>
            
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-400">បុគ្គលិក៖</span>
                <span className="font-bold text-slate-800 text-base">{successScan.employee.nameKh}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-400">Position៖</span>
                <span className="font-medium text-slate-600">{successScan.employee.position}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-400">ម៉ោងស្កេន៖</span>
                <span className="font-mono font-bold text-indigo-600 text-base">
                  {successScan.type === 'in' ? successScan.record.checkIn : successScan.record.checkOut}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">ស្ថានភាព៖</span>
                <span>
                  {successScan.type === 'in' ? (
                    successScan.record.status === 'late' ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        យឺត (Late)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ទាន់ពេល (On Time)
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      ចេញធម្មតា
                    </span>
                  )}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-5 italic">
              {successScan.type === 'in' ? '✨ សូមជូនពរអោយទទួលបានការងាររីករាយថ្ងៃនេះ!' : '🏡 សូមធ្វើដំណើរត្រឡប់ទៅផ្ទះដោយសុវត្ថិភាព!'}
            </p>

            <button
              onClick={() => setSuccessScan(null)}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer active:scale-98"
            >
              បិទផ្ទាំងនេះ (ឬបិទស្វ័យប្រវត្តក្នុង 5វិ)
            </button>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: CAMERA SCAN VIEWPORT (8 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span>ស្កេន QR Code កាមេរ៉ា</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">បើកកាមេរ៉ារបស់អ្នក ហើយបង្ហាញកាត QR បុគ្គលិកដើម្បីកត់ត្រាវត្តមាន</p>
            </div>
            
            {/* IN / OUT Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setScanType('in')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${scanType === 'in' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ស្កេនចូល (IN)</span>
              </button>
              <button
                type="button"
                onClick={() => setScanType('out')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${scanType === 'out' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ស្កេនចេញ (OUT)</span>
              </button>
            </div>
          </div>

          {/* Camera list selector */}
          {cameras.length > 1 && !isScanning && (
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">ជ្រើសរើសកាមេរ៉ា៖</span>
              <select
                value={activeCameraId || ''}
                onChange={(e) => setActiveCameraId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg p-1.5 outline-hidden"
              >
                {cameras.map(cam => (
                  <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.substring(0, 5)}`}</option>
                ))}
              </select>
            </div>
          )}

          {/* Core Viewport Canvas */}
          <div className="relative border-4 border-slate-900 rounded-2xl bg-slate-950 overflow-hidden aspect-video flex flex-col items-center justify-center p-4 group">
            {/* Cybernetic QR overlay bounds inside the viewport */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                {/* Aim grid */}
                <div className="w-56 h-56 border-2 border-indigo-400 rounded-2xl relative shadow-[0_0_50px_rgba(79,70,229,0.3)] bg-indigo-500/5">
                  {/* Four glowing corners */}
                  <div className="absolute -left-1 -top-1 w-6 h-6 border-l-4 border-t-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute -right-1 -top-1 w-6 h-6 border-r-4 border-t-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute -left-1 -bottom-1 w-6 h-6 border-l-4 border-b-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute -right-1 -bottom-1 w-6 h-6 border-r-4 border-b-4 border-indigo-400 rounded-br-lg" />
                  
                  {/* Scanning sweep laser line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_12px_#6366f1] animate-[bounce_3s_infinite]" />
                </div>
              </div>
            )}

            {/* Html5Qrcode rendering target */}
            <div id={readerId} className="w-full h-full object-cover"></div>

            {/* Inactive Standby Screen */}
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-xs">
                  <Smartphone className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white text-base font-bold">បើកម៉ាស៊ីនស្កេនកាមេរ៉ា</h3>
                  <p className="text-slate-400 text-xs max-w-sm">ចុចប៊ូតុងខាងក្រោមដើម្បីចាប់ផ្តើមកាមេរ៉ា។ សូមបង្ហាញ QR Code ចំកណ្តាលផ្ទាំងកាមេរ៉ាដើម្បីចុះវត្តមាន។</p>
                </div>
                <button
                  onClick={startCameraScan}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <Camera className="w-4 h-4" />
                  <span>ចាប់ផ្តើមស្កេនឥឡូវនេះ</span>
                </button>
              </div>
            )}

            {/* Stop Scanning Button overlay */}
            {isScanning && (
              <button
                onClick={stopCameraScan}
                className="absolute bottom-4 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg z-20 shadow-lg hover:shadow-red-900/30 transition-all cursor-pointer"
              >
                បិទសេវាកម្មស្កេន
              </button>
            )}
          </div>

          {/* Warnings & Help Info */}
          {cameraError ? (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <span className="font-bold">ព័ត៌មានកាមេរ៉ា៖</span>
                <p className="leading-relaxed">{cameraError}</p>
                <p className="font-semibold text-slate-600 mt-1">ប្រសិនបើអ្នកកំពុងសាកល្បង សូមប្រើ <strong className="text-indigo-600">"ម៉ាស៊ីនផ្សារភ្ជាប់ការស្កេនសាកល្បង"</strong> នៅចំហៀងដើម្បីចុះវត្តមានភ្លាមៗ!</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ប្រព័ន្ធស្កេនដំណើរការលើឧបករណ៍ទូរស័ព្ទ តេប្លេត និងកុំព្យូទ័រ ដែលមានការិយាល័យកាមេរ៉ា។</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: QUICK SCAN SIMULATOR (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-indigo-950 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decoration background bubbles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -z-5 animate-pulse" />

          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">ម៉ាស៊ីនស្កេនសាកល្បង (Simulator)</h2>
                <p className="text-[11px] text-indigo-200">ប្រើដើម្បីធ្វើតេស្តសាកល្បងចុះវត្តមាន ដោយមិនចាំបាច់បោះពុម្ព QR ឬបើកកាមេរ៉ា</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              ជ្រើសរើសឈ្មោះបុគ្គលិកណាម្នាក់ រួចចុច "ចុះវត្តមាន" ដើម្បីសាកល្បងស្កេន។ ប្រព័ន្ធនឹងគណនាពេលវេលាពិតប្រាកដ ដោយផ្អែកលើម៉ោងម៉ាស៊ីនរបស់អ្នកឡើយ!
            </p>

            {/* Employee dropdown picker */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">ជ្រើសរើសបុគ្គលិក៖</label>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedSimulateEmp}
                  onChange={(e) => setSelectedSimulateEmp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 text-white border border-indigo-800/80 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans cursor-pointer h-11"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className="text-slate-800">
                      [{emp.id}] {emp.nameKh} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions for Scanner */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setScanType('in');
                  setTimeout(() => {
                    handleSimulateScan();
                  }, 50);
                }}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-4 py-3 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5" />
                <span>ស្កេន ចូលធ្វើការ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanType('out');
                  setTimeout(() => {
                    handleSimulateScan();
                  }, 50);
                }}
                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-650 text-white text-xs font-extrabold px-4 py-3 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ស្កេន ចេញត្រឡប់</span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-indigo-950 flex items-center justify-between text-[11px] text-slate-400">
            <span>របៀបដំណើរការ៖ Simulates scanning QR code</span>
            <div className="flex items-center gap-1 text-indigo-400 font-bold">
              <Clock className="w-3 h-3" />
              <span>Real-Time Check</span>
            </div>
          </div>
        </div>

        {/* Tip section */}
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-sky-900 text-xs space-y-1.5 shadow-2xs">
          <h4 className="font-bold flex items-center gap-1 text-[#0369a1]">💡 គន្លឹះងាយៗសម្រាប់ស្កេន៖</h4>
          <ol className="list-decimal pl-4 space-y-1 text-[#0369a1] opacity-90 leading-relaxed">
            <li>សូមបង្កើតកាត QR របស់បុគ្គលិកម្នាក់ក្នុងផ្ទាំង <strong>"បញ្ជីបុគ្គលឹក"</strong>។</li>
            <li>បើកកាមេរ៉ារួចយកទូរស័ព្ទបង្ហាញ QR Canvas ទៅកាន់កាមេរ៉ានោះ។</li>
            <li>ប្រព័ន្ធនឹងស្កេនភ្លាមៗ និងចុះវត្តមានទាន់ពេល (ឬយឺត) ស្វ័យប្រវត្ត។</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
