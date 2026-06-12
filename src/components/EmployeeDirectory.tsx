import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { generateId } from '../data';
import QRCode from 'qrcode';
import { 
  UserPlus, 
  Search, 
  QrCode, 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  X, 
  Phone, 
  Mail, 
  Briefcase, 
  Clock, 
  Calendar,
  Sparkles,
  BadgeAlert
} from 'lucide-react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function EmployeeDirectory({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee
}: EmployeeDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form States
  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('ផ្នែកបច្ចេកវិទ្យា (IT)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [workTime, setWorkTime] = useState('08:00');
  const [customDepts, setCustomDepts] = useState<string[]>([]);
  const [customDeptInput, setCustomDeptInput] = useState('');

  const allDepartments = Array.from(new Set([
    'ផ្នែកបច្ចេកវិទ្យា (IT)',
    'ផ្នែកធនធានមនុស្ស (HR)',
    'ផ្នែកលក់ (Sales)',
    'ផ្នែកហិរញ្ញវត្ថុ (Finance)',
    'ផ្នែកទីផ្សារ (Marketing)',
    'ផ្នែករចនា (Creative Design)',
    'ផ្នែករដ្ឋបាល (Admin)',
    ...customDepts,
    ...employees.map(emp => emp.department).filter(Boolean)
  ]));

  // Selected Employee for QR Badge View
  const [selectedQR, setSelectedQR] = useState<Employee | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Handle building the QR Code URL
  useEffect(() => {
    if (selectedQR) {
      QRCode.toDataURL(selectedQR.id, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e293b', // Deep slate slate-800
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error("Error generating QR:", err);
      });
    } else {
      setQrCodeUrl('');
    }
  }, [selectedQR]);

  // Handle Edit Setup
  const handleStartEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setNameKh(emp.nameKh);
    setNameEn(emp.nameEn);
    setPosition(emp.position);
    setDepartment(emp.department);
    setPhone(emp.phone);
    setEmail(emp.email);
    setWorkTime(emp.workTime);
    setIsAddOpen(true);
  };

  const handleResetForm = () => {
    setNameKh('');
    setNameEn('');
    setPosition('');
    setDepartment('ផ្នែកបច្ចេកវិទ្យា (IT)');
    setCustomDeptInput('');
    setPhone('');
    setEmail('');
    setWorkTime('08:00');
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKh || !nameEn || !position) {
      alert("សូមបំពេញព័ត៌មានដែលចាំបាច់ (ឈ្មោះខ្មែរ ឈ្មោះអង់គ្លេស និងតួនាទី)!");
      return;
    }

    let finalDepartment = department;
    if (department === '__CUSTOM__') {
      const trimmed = customDeptInput.trim();
      if (!trimmed) {
        alert("សូមបញ្ចូលឈ្មោះផ្នែកថ្មី!");
        return;
      }
      finalDepartment = trimmed;
      if (!customDepts.includes(trimmed)) {
        setCustomDepts(prev => [...prev, trimmed]);
      }
    }

    const avatarColors = [
      'bg-blue-600', 'bg-emerald-600', 'bg-fuchsia-600', 
      'bg-amber-600', 'bg-rose-600', 'bg-violet-600', 
      'bg-indigo-600', 'bg-teal-600', 'bg-sky-600'
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        nameKh,
        nameEn,
        position,
        department: finalDepartment,
        phone,
        email,
        workTime
      };
      onEditEmployee(updated);
    } else {
      const newEmp: Employee = {
        id: `EMP-${generateId()}`,
        nameKh,
        nameEn,
        position,
        department: finalDepartment,
        phone,
        email,
        avatarColor: randomColor,
        workTime,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      onAddEmployee(newEmp);
    }

    handleResetForm();
    setIsAddOpen(false);
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (
      emp.id.toLowerCase().includes(term) ||
      emp.nameKh.toLowerCase().includes(term) ||
      emp.nameEn.toLowerCase().includes(term) ||
      emp.position.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
  });

  // Handle PNG badge download
  const handleDownloadBadge = () => {
    if (!selectedQR || !qrCodeUrl) return;
    
    // Create an elegant hidden canvas to draw the badge for download
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background card (White with beautiful blue/slate border)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 600);
    
    // Header gradient background
    const gradient = ctx.createLinearGradient(0, 0, 400, 140);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 140);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('កាតសម្គាល់បុគ្គលឹក', 200, 50);
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('STAFF IDENTIFICATION BADGE', 200, 75);
    ctx.fillText('--------------------------------------', 200, 95);

    // Decorative company logo text or generic icon
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8'; // sky blue
    ctx.fillText('ក្រុមហ៊ុនផ្ទាល់ខ្លួន CO., LTD.', 200, 120);

    // Employee Details
    ctx.fillStyle = '#334155'; // slate-700
    ctx.font = 'bold 22px Inter, Arial';
    ctx.fillText(selectedQR.nameKh, 200, 190);
    
    ctx.font = 'italic 16px Inter, sans-serif';
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.fillText(selectedQR.nameEn, 200, 215);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(selectedQR.position, 200, 245);
    
    ctx.fillStyle = '#475569';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(`ផ្នែក៖ ${selectedQR.department}`, 200, 268);

    // Draw QR Code
    const qrImage = new Image();
    qrImage.onload = () => {
      // Draw QR centered
      ctx.drawImage(qrImage, 75, 290, 250, 250);

      // Badge Footer (ID and working hours)
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px Courier, monospace';
      ctx.fillText(`ID: ${selectedQR.id}`, 200, 565);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`ម៉ោងធ្វើការ៖ ${selectedQR.workTime} - ច្រកចូលស្កេន QR`, 200, 585);

      // Trigger download
      const link = document.createElement('a');
      link.download = `QR_Badge_${selectedQR.id}_${selectedQR.nameEn.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    qrImage.src = qrCodeUrl;
  };

  const handlePrintBadge = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>បោះពុម្ពកាតបុគ្គលឹក - ${selectedQR?.nameEn}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif, Khmer;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f1f5f9;
            }
            .badge-card {
              width: 320px;
              border: 2px solid #1e293b;
              border-radius: 16px;
              background: #ffffff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              overflow: hidden;
              text-align: center;
            }
            .header {
              background: linear-gradient(135deg, #1e293b, #0f172a);
              color: white;
              padding: 24px 16px;
            }
            .header h2 { margin: 0; font-size: 18px; font-weight: bold; }
            .header p { margin: 4px 0 0 0; font-size: 11px; opacity: 0.8; letter-spacing: 1px; }
            .content {
              padding: 24px;
            }
            .name-kh { font-size: 20px; font-weight: bold; color: #1e293b; margin: 0; }
            .name-en { font-size: 14px; color: #64748b; font-style: italic; margin: 4px 0 12px 0; }
            .position { font-size: 14px; font-weight: bold; color: #0284c7; margin: 0; }
            .dept { font-size: 12px; color: #475569; margin: 4px 0 0 0; }
            .qr-container {
              margin: 20px auto;
              width: 180px;
              height: 180px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
            }
            .emp-id { font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a; margin: 0; }
            .footer { font-size: 10px; color: #94a3b8; margin-top: 8px; }
            @media print {
              body { background-color: white; }
              .badge-card { box-shadow: none; border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="header">
              <h2>កាតសម្គាល់បុគ្គលឹក</h2>
              <p>STAFF IDENTIFICATION BADGE</p>
            </div>
            <div class="content">
              <div class="name-kh">${selectedQR?.nameKh}</div>
              <div class="name-en">${selectedQR?.nameEn}</div>
              <div class="position">${selectedQR?.position}</div>
              <div class="dept">ផ្នែក៖ ${selectedQR?.department}</div>
              
              <div class="qr-container">
                <img src="${qrCodeUrl}" alt="QR" />
              </div>
              
              <div class="emp-id">ID: ${selectedQR?.id}</div>
              <div class="footer">ម៉ោងធ្វើការ៖ ${selectedQR?.workTime} | ច្រកចូលចុះវត្តមានទ្វារធំ</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">គ្រប់គ្រងបញ្ជីបុគ្គលឹក</h2>
          <p className="text-sm text-slate-500 mt-1">គ្រប់គ្រងព័ត៌មានបុគ្គលឹក កែប្រែ និងបង្កើតកាត QR សម្រាប់ចុះវត្តមាន</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ផ្នែក តួនាទី..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-colors"
            />
          </div>
          
          <button
            onClick={() => { handleResetForm(); setIsAddOpen(true); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>បន្ថែមបុគ្គលឹកថ្មី</span>
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-2xl py-12 px-4 shadow-sm text-center">
          <BadgeAlert className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-slate-600 font-medium">មិនមានទិន្នន័យបុគ្គលឹកទេ</p>
          <p className="text-slate-400 text-sm mt-1">សូមសាកល្បងស្វែងរកពាក្យផ្សេង ឬចុច "បន្ថែមបុគ្គលឹកថ្មី" ដើម្បីបង្កើតគណនីបុគ្គលឹកថ្មី។</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <div 
              key={emp.id} 
              id={`emp-card-${emp.id}`}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
            >
              {/* Card top banner accent */}
              <div className="h-2 bg-slate-100 group-hover:bg-slate-200 transition-colors" />
              
              <div className="p-5 flex-1">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0 ${emp.avatarColor || 'bg-indigo-600'}`}>
                    {emp.nameEn.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  
                  {/* Core details */}
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base leading-snug truncate" title={emp.nameKh}>
                      {emp.nameKh}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium italic truncate">{emp.nameEn}</p>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                      {emp.id}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3.5 border-t border-slate-50 pt-4">
                  {/* Position info */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{emp.position}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{emp.phone || 'គ្មានលេខទូរស័ព្ទ'}</span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 min-w-0">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email || 'គ្មានអុីម៉ែល'}</span>
                  </div>

                  {/* Base Time */}
                  <div className="flex items-center gap-2.5 text-xs text-indigo-600 font-medium bg-indigo-50/50 p-2 rounded-lg">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>ម៉ោងបើកការសង្វារ៖ <strong className="font-bold">{emp.workTime}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedQR(emp)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-indigo-50/20 hover:border-indigo-200 transition-all cursor-pointer"
                  title="មើលកាត QR"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>កាត QR</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(emp)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                    title="កែប្រែព័ត៌មាន"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`តើអ្នកពិតជាចង់លុបបុគ្គលឹកឈ្មោះ "${emp.nameKh}" មែនទេ? រាល់ការលុបនឹងមិនអាចត្រឡប់វិញបានឡើយ!`)) {
                        onDeleteEmployee(emp.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="លុបគណនី"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Form for Add/Edit Employee */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left p-6">
            <div>
              {/* Form Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingEmployee ? "កែប្រែព័ត៌មានបុគ្គលឹក" : "បន្ថែមបុគ្គលឹកថ្មី"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">បំពេញទិន្នន័យខាងក្រោមដើម្បីរក្សាទុកក្នុងប្រព័ន្ធ</p>
                </div>
                <button 
                  onClick={() => { handleResetForm(); setIsAddOpen(false); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ID display if editing */}
                {editingEmployee && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">លេខសម្គាល់បុគ្គលិក</label>
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono font-bold text-slate-600">
                      {editingEmployee.id}
                    </div>
                  </div>
                )}

                {/* Position & Department in two columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">តួនាទី <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="ឧ. Designer"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                      className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">ផ្នែក / ការិយាល័យ</label>
                    <select
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        if (e.target.value !== '__CUSTOM__') {
                          setCustomDeptInput('');
                        }
                      }}
                      className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {allDepartments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      <option value="__CUSTOM__">+ បន្ថែមផ្នែកថ្មី...</option>
                    </select>
                  </div>
                </div>

                {/* Custom Department Entry Input */}
                {department === '__CUSTOM__' && (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 animate-[fadeIn_0.2s_ease-out]">
                    <label className="block text-xs font-semibold text-indigo-700">ឈ្មោះផ្នែកថ្មី <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder="ឧ. ផ្នែកលក់, ផ្នែកដឹកជញ្ជូន"
                      value={customDeptInput}
                      onChange={(e) => setCustomDeptInput(e.target.value)}
                      required
                      className="mt-1 w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                )}

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">លេខទូរស័ព្ទ</label>
                    <input
                      type="text"
                      placeholder="012 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">អុីម៉ែល</label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Work Starting Target Time (Late Threshold) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>ម៉ោងកំណត់ចូលធ្វើការ (កាតព្វកិច្ច)</span>
                  </label>
                  <input
                    type="time"
                    value={workTime}
                    onChange={(e) => setWorkTime(e.target.value)}
                    required
                    className="mt-1 w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">ប្រសិនបើបុគ្គលឹកស្កេនចូលក្រោយម៉ោងនេះ នឹងត្រូវកត់ត្រាថា "យឺត" (Late)។</p>
                </div>
              </form>
            </div>

            {/* Form Footer Actions */}
            <div className="border-t border-slate-100 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => { handleResetForm(); setIsAddOpen(false); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs cursor-pointer"
              >
                {editingEmployee ? "រក្សាការផ្លាស់ប្តូរ" : "បង្កើតទិន្នន័យ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Badge View Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 text-center relative">
              <h4 className="font-bold text-base">កាតសម្គាល់បុគ្គលឹក</h4>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Staff Identification Badge</p>
              <button 
                onClick={() => setSelectedQR(null)}
                className="absolute right-4 top-4 p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Badge UI) */}
            <div className="p-6 text-center space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-snug">{selectedQR.nameKh}</h3>
                <p className="text-sm text-slate-500 font-medium italic">{selectedQR.nameEn}</p>
              </div>

              <div className="inline-flex flex-col items-center px-4 py-1.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-xs font-bold text-indigo-700">{selectedQR.position}</span>
                <span className="text-[10px] text-indigo-500 mt-0.5">{selectedQR.department}</span>
              </div>

              {/* QR Image Container */}
              <div className="w-48 h-48 mx-auto border-2 border-slate-100 p-2 rounded-2xl bg-white shadow-inner flex items-center justify-center relative">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Employee QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="font-mono font-bold text-slate-800 text-sm tracking-widest">ID: {selectedQR.id}</div>
                <div className="text-[11px] text-slate-500">ម៉ោងកត់វត្តមាន៖ {selectedQR.workTime}</div>
              </div>

              {/* Actions row: Download & Print */}
              <div className="flex gap-3 border-t border-slate-50 pt-4 mt-2">
                <button
                  type="button"
                  onClick={handleDownloadBadge}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 py-2 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ទាញយកកាត</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintBadge}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ពកាត</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
