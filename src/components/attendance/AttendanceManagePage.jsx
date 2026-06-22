// AttendanceManagePage — Quản lý điểm danh cho cấp trên (admin/manager/member)
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MdAdd, MdDelete, MdEdit, MdCheckCircle, MdCancel, MdAccessTime, MdGroup, MdVisibility, MdClose, MdPhone, MdPerson, MdImage, MdMoreTime, MdSearch, MdFileDownload } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import useAttendancePrograms from '../../hooks/useAttendancePrograms';
import useAttendanceRecords from '../../hooks/useAttendanceRecords';
import { useUnits } from '../../hooks/useUnits';
import { createAttendanceProgram, updateAttendanceProgram, deleteAttendanceProgram } from '../../firebase/attendanceFirestore';
import DateTimePicker from '../common/DateTimePicker';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportAttendanceUnitsToExcel } from '../../utils/exportExcel';

const AttendanceManagePage = () => {
  const { userProfile } = useAuth();
  const { programs, loading } = useAttendancePrograms();
  const { units } = useUnits();

  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Form state — dùng Date objects cho Flatpickr
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime(null);
    setEndTime(null);
    setEditingProgram(null);
    setShowForm(false);
  };

  const openEditForm = (program) => {
    setEditingProgram(program);
    setTitle(program.title);
    setDescription(program.description || '');
    setStartTime(program.startTime || null);
    setEndTime(program.endTime || null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    if (endTime <= startTime) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    try {
      if (editingProgram) {
        await updateAttendanceProgram(editingProgram.id, { title: title.trim(), description: description.trim(), startTime: startTime.toISOString(), endTime: endTime.toISOString() });
        toast.success('Đã cập nhật chương trình.');
      } else {
        await createAttendanceProgram({ title: title.trim(), description: description.trim(), startTime: startTime.toISOString(), endTime: endTime.toISOString(), createdBy: userProfile.id });
        toast.success('Đã tạo chương trình điểm danh.');
      }
      resetForm();
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAttendanceProgram(id);
      toast.success('Đã xoá chương trình.');
      setConfirmDelete(null);
      if (selectedProgram?.id === id) setSelectedProgram(null);
    } catch (error) {
      toast.error('Lỗi xoá: ' + error.message);
    }
  };

  // Gia hạn — mở modal thay vì prompt
  const [extendingProgram, setExtendingProgram] = useState(null);
  const [extendDate, setExtendDate] = useState(null);

  const handleExtendSubmit = async () => {
    if (!extendDate || !extendingProgram) return;
    try {
      await updateAttendanceProgram(extendingProgram.id, { endTime: extendDate.toISOString(), status: 'open' });
      toast.success('Đã gia hạn thời gian điểm danh.');
      setExtendingProgram(null);
      setExtendDate(null);
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Điểm danh</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý các chương trình điểm danh của đơn vị cơ sở</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <MdAdd size={20} /> Tạo chương trình
        </button>
      </div>

      {/* Form tạo/sửa */}
      {showForm && (
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/10 animate-fade-in-up">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
            {editingProgram ? 'Chỉnh sửa chương trình' : 'Tạo chương trình mới'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tên chương trình *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Lễ kỷ niệm ngày thành lập Đoàn 26/3"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về chương trình (tuỳ chọn)"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Bắt đầu điểm danh *</label>
                <DateTimePicker
                  selected={startTime}
                  onChange={setStartTime}
                  placeholder="Chọn thời gian bắt đầu"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Kết thúc điểm danh *</label>
                <DateTimePicker
                  selected={endTime}
                  onChange={setEndTime}
                  placeholder="Chọn thời gian kết thúc"
                  minDate={startTime}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all">
                {editingProgram ? 'Cập nhật' : 'Tạo'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách chương trình */}
      {programs.length === 0 ? (
        <div className="text-center py-20">
          <MdAccessTime size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-bold">Chưa có chương trình điểm danh nào.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map(program => {
            const status = getProgramStatus(program);
            const statusConfig = {
              open: { label: 'Đang mở', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
              expired: { label: 'Đã hết giờ', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
              closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
              upcoming: { label: 'Sắp bắt đầu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
            };
            const cfg = statusConfig[status];

            return (
              <div key={program.id} className="glass-card p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-base font-black text-gray-900 dark:text-white truncate">{program.title}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                        {cfg.label}
                      </span>
                    </div>
                    {program.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">{program.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <MdAccessTime size={14} />
                        {program.startTime ? format(program.startTime, 'dd/MM HH:mm', { locale: vi }) : '—'}
                        {' → '}
                        {program.endTime ? format(program.endTime, 'dd/MM HH:mm', { locale: vi }) : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedProgram(program)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-bold text-xs transition-all"
                    >
                      <MdVisibility size={16} /> Xem
                    </button>
                    {(status === 'expired' || status === 'closed') && (
                      <button
                        onClick={() => { setExtendingProgram(program); setExtendDate(null); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-bold text-xs transition-all"
                        title="Gia hạn"
                      >
                        <MdMoreTime size={16} /> Gia hạn
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(program)}
                      className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                      title="Sửa"
                    >
                      <MdEdit size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(program)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title="Xoá"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Chi tiết chương trình — Modal */}
      {selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          units={units}
          onClose={() => setSelectedProgram(null)}
        />
      )}

      {/* Gia hạn Modal */}
      {extendingProgram && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setExtendingProgram(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up z-10">
            <h4 className="text-base font-black text-gray-900 dark:text-white mb-4">Gia hạn điểm danh</h4>
            <p className="text-sm text-gray-500 mb-4">Chọn thời gian kết thúc mới cho "{extendingProgram.title}"</p>
            <DateTimePicker
              selected={extendDate}
              onChange={setExtendDate}
              placeholder="Chọn thời gian kết thúc mới"
              minDate={new Date()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
            <div className="flex gap-3 mt-5">
              <button onClick={handleExtendSubmit} disabled={!extendDate} className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-all">
                Gia hạn
              </button>
              <button onClick={() => setExtendingProgram(null)} className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all">
                Huỷ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmDialog
          title="Xoá chương trình"
          message={`Bạn có chắc muốn xoá "${confirmDelete.title}"? Tất cả dữ liệu điểm danh liên quan sẽ bị mất.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Xoá"
          type="danger"
        />
      )}
    </div>
  );
};

// === POPUP CHI TIẾT CHƯƠNG TRÌNH ===
const ProgramDetailModal = ({ program, units, onClose }) => {
  const { records, loading } = useAttendanceRecords(program.id);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [unitBlockFilter, setUnitBlockFilter] = useState('all');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');

  const attendedUnitIds = useMemo(() => new Set(records.map(r => r.unitId)), [records]);
  const recordByUnitId = useMemo(() => new Map(records.map(record => [record.unitId, record])), [records]);
  const missingUnitCount = Math.max(0, units.length - attendedUnitIds.size);
  const filteredUnits = useMemo(() => {
    const search = unitSearchTerm.trim().toLowerCase();
    return units.filter(unit => {
      const matchesBlock = unitBlockFilter === 'all' || unit.blockId === unitBlockFilter;
      if (!matchesBlock) return false;
      const attended = attendedUnitIds.has(unit.id);
      if (attendanceStatusFilter === 'attended' && !attended) return false;
      if (attendanceStatusFilter === 'missing' && attended) return false;
      if (!search) return true;

      return [
        unit.unitName,
        unit.name,
        unit.blockName,
        unit.typeName,
      ].some(value => (value || '').toLowerCase().includes(search));
    });
  }, [units, unitBlockFilter, attendanceStatusFilter, attendedUnitIds, unitSearchTerm]);
  const filterLabel = [
    attendanceStatusFilter === 'attended' ? 'Đã điểm danh' : '',
    attendanceStatusFilter === 'missing' ? 'Chưa điểm danh' : '',
    unitBlockFilter !== 'all' ? UNIT_BLOCKS.find(block => block.id === unitBlockFilter)?.name : '',
    unitSearchTerm.trim() ? `Tìm: ${unitSearchTerm.trim()}` : '',
  ].filter(Boolean).join(' - ') || 'Tất cả đơn vị';

  const toggleStatusFilter = (status) => {
    setAttendanceStatusFilter(current => current === status ? 'all' : status);
  };

  const handleExportAttendance = async () => {
    try {
      await exportAttendanceUnitsToExcel(program, filteredUnits, records, filterLabel);
      toast.success('Đã xuất file Excel điểm danh.');
    } catch (error) {
      toast.error('Lỗi xuất Excel: ' + error.message);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
        <div
          className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{program.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {program.startTime ? format(program.startTime, 'dd/MM/yyyy HH:mm', { locale: vi }) : ''}
                  {' → '}
                  {program.endTime ? format(program.endTime, 'dd/MM/yyyy HH:mm', { locale: vi }) : ''}
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <MdClose size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => toggleStatusFilter('attended')}
                className={`px-3 py-1 rounded-full font-bold text-xs transition-all ${
                  attendanceStatusFilter === 'attended'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                }`}
                title="Lọc đơn vị đã điểm danh"
              >
                {attendedUnitIds.size} đã điểm danh
              </button>
              <button
                type="button"
                onClick={() => toggleStatusFilter('missing')}
                className={`px-3 py-1 rounded-full font-bold text-xs transition-all ${
                  attendanceStatusFilter === 'missing'
                    ? 'bg-gray-700 text-white shadow-md shadow-gray-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Lọc đơn vị chưa điểm danh"
              >
                {missingUnitCount} chưa điểm danh
              </button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                <MdSearch size={18} className="text-gray-400 shrink-0" />
                <input
                  value={unitSearchTerm}
                  onChange={e => setUnitSearchTerm(e.target.value)}
                  placeholder="Tìm đơn vị..."
                  className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none placeholder-gray-400 font-medium"
                />
                {unitSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setUnitSearchTerm('')}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Xóa tìm kiếm"
                  >
                    <MdClose size={16} />
                  </button>
                )}
              </div>
              <select
                value={unitBlockFilter}
                onChange={e => setUnitBlockFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Tất cả Khối</option>
                {UNIT_BLOCKS.map(block => (
                  <option key={block.id} value={block.id}>{block.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExportAttendance}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                title="Xuất danh sách đang hiển thị ra Excel"
              >
                <MdFileDownload size={18} />
                <span>Xuất Excel</span>
              </button>
            </div>
            {(unitSearchTerm || unitBlockFilter !== 'all' || attendanceStatusFilter !== 'all') && (
              <p className="mt-2 text-xs text-gray-400">
                Hiển thị {filteredUnits.length}/{units.length} đơn vị
              </p>
            )}
          </div>

          {/* Body — scrollable */}
          <div className="p-6 overflow-y-auto flex-1 space-y-2">
            {loading ? (
              <LoadingSpinner />
            ) : units.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Chưa có đơn vị nào trong hệ thống.</p>
            ) : filteredUnits.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Không có đơn vị phù hợp.</p>
            ) : (
              filteredUnits.map(unit => {
                const attended = attendedUnitIds.has(unit.id);
                const record = recordByUnitId.get(unit.id);
                return (
                  <div
                    key={unit.id}
                    onClick={() => attended && setViewingRecord(record)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                      attended
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer hover:shadow-md'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black ${
                        attended ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {attended ? <MdCheckCircle size={18} /> : <MdCancel size={18} />}
                      </div>
                      <span className={`font-bold text-sm ${attended ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                        {unit.name || unit.unitName}
                      </span>
                    </div>
                    {attended && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Bấm để xem →</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Record detail popup — stacked above */}
      {viewingRecord && (
        <RecordDetailPopup record={viewingRecord} onClose={() => setViewingRecord(null)} />
      )}
    </>,
    document.body
  );
};

// === POPUP CHI TIẾT BẢN GHI ĐIỂM DANH ===
const RecordDetailPopup = ({ record, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up z-10"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-black text-gray-900 dark:text-white">Chi tiết điểm danh</h4>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <MdClose size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Đơn vị</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{record.unitName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MdPerson size={12} /> Đại diện</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{record.representativeName}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MdPhone size={12} /> SĐT</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{record.representativePhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MdAccessTime size={12} /> Có mặt lúc</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{record.arrivalTime}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MdGroup size={12} /> Tham dự</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{record.participantCount} người</p>
              </div>
            </div>

            {record.photos && record.photos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MdImage size={12} /> Ảnh minh chứng</p>
                <div className="grid grid-cols-3 gap-2">
                  {record.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Ảnh ${i + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {record.submittedAt && (
              <p className="text-xs text-gray-400 text-right">
                Nộp lúc: {format(record.submittedAt, 'HH:mm dd/MM/yyyy', { locale: vi })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AttendanceManagePage;
