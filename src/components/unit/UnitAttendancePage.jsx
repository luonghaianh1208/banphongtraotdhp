// UnitAttendancePage — Trang điểm danh cho đơn vị cơ sở
import { useState, useMemo } from 'react';
import { MdAccessTime, MdCheckCircle, MdLock, MdSend, MdDelete, MdCloudUpload, MdPerson, MdPhone, MdGroup, MdImage, MdSchedule, MdClose } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import useAttendancePrograms from '../../hooks/useAttendancePrograms';
import useAttendanceRecords from '../../hooks/useAttendanceRecords';
import { submitAttendanceRecord, uploadAttendancePhotos } from '../../firebase/attendanceFirestore';
import TimePicker from '../common/TimePicker';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const UnitAttendancePage = () => {
  const { currentUser, userProfile } = useAuth();
  const { programs, loading } = useAttendancePrograms();
  const [selectedProgram, setSelectedProgram] = useState(null);

  const getProgramStatus = (program) => {
    const now = new Date();
    if (program.status === 'closed') return 'closed';
    if (program.endTime && now > program.endTime) return 'expired';
    if (program.startTime && now < program.startTime) return 'upcoming';
    return 'open';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Điểm danh</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Điểm danh tham gia các chương trình của cấp trên</p>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-20">
          <MdAccessTime size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">Chưa có chương trình điểm danh nào.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map(program => {
            const status = getProgramStatus(program);
            return (
              <ProgramCard
                key={program.id}
                program={program}
                status={status}
                unitId={currentUser?.uid}
                unitName={userProfile?.name || userProfile?.unitName || ''}
                onSelect={() => setSelectedProgram(program)}
              />
            );
          })}
        </div>
      )}

      {/* Form điểm danh — full-screen modal */}
      {selectedProgram && (
        <AttendanceFormModal
          program={selectedProgram}
          unitId={currentUser?.uid}
          unitName={userProfile?.name || userProfile?.unitName || ''}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  );
};

// === CARD CHƯƠNG TRÌNH ===
const ProgramCard = ({ program, status, unitId, unitName, onSelect }) => {
  const { records } = useAttendanceRecords(program.id);
  const myRecord = useMemo(() => records.find(r => r.unitId === unitId), [records, unitId]);

  const statusConfig = {
    open: { label: 'Đang mở', color: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
    expired: { label: 'Đã hết giờ', color: 'border-gray-200 dark:border-gray-700', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
    closed: { label: 'Đã đóng', color: 'border-gray-200 dark:border-gray-700', badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
    upcoming: { label: 'Sắp bắt đầu', color: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  };
  const cfg = statusConfig[status];

  return (
    <div className={`glass-card p-5 rounded-2xl border ${cfg.color} transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="text-base font-black text-gray-900 dark:text-white truncate">{program.title}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'open' ? 'animate-pulse' : ''}`} />
              {cfg.label}
            </span>
            {myRecord && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                <MdCheckCircle size={14} /> Đã điểm danh
              </span>
            )}
          </div>
          {program.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{program.description}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MdAccessTime size={14} />
            {program.startTime ? format(program.startTime, 'HH:mm dd/MM', { locale: vi }) : '—'}
            {' → '}
            {program.endTime ? format(program.endTime, 'HH:mm dd/MM', { locale: vi }) : '—'}
          </div>
        </div>

        <div className="shrink-0">
          {myRecord ? (
            <div className="text-xs text-gray-400 text-right">
              <p>Đại diện: <span className="font-bold text-gray-600 dark:text-gray-300">{myRecord.representativeName}</span></p>
              <p>Nộp: {myRecord.submittedAt ? format(myRecord.submittedAt, 'HH:mm dd/MM', { locale: vi }) : '—'}</p>
            </div>
          ) : status === 'open' ? (
            <button
              onClick={onSelect}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <MdSend size={16} /> Điểm danh
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
              <MdLock size={16} /> Không thể điểm danh
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// === FORM ĐIỂM DANH — FULL OVERLAY MODAL ===
const AttendanceFormModal = ({ program, unitId, unitName, onClose }) => {
  const [representativeName, setRepresentativeName] = useState('');
  const [representativePhone, setRepresentativePhone] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 3) {
      toast.error('Tối đa 3 ảnh.');
      return;
    }
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`Ảnh "${f.name}" vượt quá 10MB.`);
        return;
      }
      if (!f.type.startsWith('image/')) {
        toast.error(`File "${f.name}" không phải ảnh.`);
        return;
      }
    }
    setPhotos(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!representativeName.trim()) { toast.error('Vui lòng nhập tên người đại diện.'); return false; }
    if (!/^\d{10}$/.test(representativePhone)) { toast.error('Số điện thoại phải đúng 10 chữ số.'); return false; }
    if (!arrivalTime) { toast.error('Vui lòng chọn thời gian có mặt.'); return false; }
    if (!participantCount || Number(participantCount) < 1) { toast.error('Số lượng tham dự phải ít nhất 1 người.'); return false; }
    if (photos.length === 0) { toast.error('Vui lòng tải lên ít nhất 1 ảnh.'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const photoUrls = await uploadAttendancePhotos(program.id, unitId, photos);

      const [hours, minutes] = arrivalTime.split(':');
      const arrivalDate = new Date();
      arrivalDate.setHours(Number(hours), Number(minutes), 0, 0);

      await submitAttendanceRecord({
        programId: program.id,
        unitId,
        unitName,
        representativeName: representativeName.trim(),
        representativePhone: representativePhone.trim(),
        arrivalTime,
        arrivalTimestamp: arrivalDate.toISOString(),
        participantCount: Number(participantCount),
        photos: photoUrls,
      });

      toast.success('Điểm danh thành công!');
      onClose();
    } catch (error) {
      console.error('Attendance submit error:', error);
      toast.error('Lỗi gửi điểm danh: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up z-10"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Điểm danh</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <MdClose size={20} className="text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{program.title}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Người đại diện */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                <MdPerson size={16} /> Người đại diện điểm danh *
              </label>
              <input
                type="text"
                value={representativeName}
                onChange={e => setRepresentativeName(e.target.value)}
                placeholder="Họ và tên người đại diện"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                required
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                <MdPhone size={16} /> Số điện thoại *
              </label>
              <input
                type="tel"
                value={representativePhone}
                onChange={e => setRepresentativePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="0901234567"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                required
              />
              {representativePhone && representativePhone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Cần nhập đúng 10 chữ số</p>
              )}
            </div>

            {/* Thời gian có mặt — Flatpickr TimePicker */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                <MdSchedule size={16} /> Thời gian có mặt *
              </label>
              <TimePicker
                value={arrivalTime}
                onChange={setArrivalTime}
                placeholder="Chọn giờ có mặt"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Số lượng tham dự */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                <MdGroup size={16} /> Số lượng tham dự *
              </label>
              <input
                type="number"
                value={participantCount}
                onChange={e => setParticipantCount(e.target.value)}
                min="1"
                placeholder="VD: 15"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                required
              />
            </div>

            {/* Upload ảnh */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                <MdImage size={16} /> Ảnh minh chứng * <span className="text-xs font-normal text-gray-400">(1-3 ảnh, tối đa 10MB/ảnh)</span>
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {previews.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <MdDelete size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all">
                  <MdCloudUpload size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-bold">Chọn ảnh ({photos.length}/3)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <MdSend size={18} /> Gửi điểm danh
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-6 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnitAttendancePage;
