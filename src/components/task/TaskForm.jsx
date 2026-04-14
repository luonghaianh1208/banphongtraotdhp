// TaskForm — form tạo/sửa task
import { useState } from 'react';
import { MdSave, MdClose, MdUploadFile } from 'react-icons/md';
import { useTaskConfig } from '../../context/TaskConfigContext';
import { formatForInput, parseVNTime } from '../../utils/dateUtils';
import { uploadFile, validateFile } from '../../firebase/storage';
import toast from 'react-hot-toast';
import DateTimePicker from '../common/DateTimePicker';

const TaskForm = ({ task, users, currentUser, onSubmit, onClose }) => {
  const isEdit = !!task;
  const { categories, priorities } = useTaskConfig();
  const [title, setTitle] = useState(task?.title || '');
  const [assignees, setAssignees] = useState(task?.assignees || []);
  const [priority, setPriority] = useState(task?.priority || (priorities[0]?.id || 'medium'));
  const [category, setCategory] = useState(task?.category || '');
  
  const initialDeadline = task?.deadline?.toDate ? task.deadline.toDate() : (task?.deadline ? new Date(task.deadline) : null);
  const [deadline, setDeadline] = useState(initialDeadline);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAssigneeToggle = (userId) => {
    setAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    for (const file of selectedFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return toast.error('Vui lòng nhập tiêu đề');
    if (!deadline) return toast.error('Vui lòng chọn thời hạn');
    if (assignees.length === 0) return toast.error('Vui lòng chọn ít nhất 1 người thực hiện');

    setLoading(true);
    try {
      // Upload files nếu có
      let uploadedFiles = task?.attachments || [];
      if (files.length > 0) {
        const taskId = task?.id || 'temp_' + Date.now();
        for (const file of files) {
          const uploaded = await uploadFile(file, taskId, currentUser.uid);
          uploadedFiles = [...uploadedFiles, uploaded];
        }
      }

      await onSubmit({
        title: title.trim(),
        assignees,
        priority,
        category: category || 'other',
        deadline: deadline,
        attachments: uploadedFiles,
        createdBy: task?.createdBy || currentUser.uid,
      });

      toast.success(isEdit ? 'Đã cập nhật công việc' : 'Đã tạo công việc mới');
      onClose();
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tiêu đề */}
      <div>
        <label className="label">Tiêu đề công việc <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input"
          placeholder="Nhập tiêu đề công việc..."
          autoFocus
        />
      </div>

      {/* Người thực hiện */}
      <div>
        <label className="label">Người thực hiện <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {users.filter(u => u.isActive !== false).map(user => (
            <label
              key={user.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                assignees.includes(user.id)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={assignees.includes(user.id)}
                onChange={() => handleAssigneeToggle(user.id)}
                className="sr-only"
              />
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                {user.displayName?.charAt(0)}
              </div>
              {user.displayName}
            </label>
          ))}
        </div>
      </div>

      {/* Row: Ưu tiên + Phân loại + Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Độ ưu tiên</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} className="input">
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Phân loại</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="input">
            <option value="">-- Chọn phân loại --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Thời hạn <span className="text-red-500">*</span></label>
          <DateTimePicker
            selected={deadline}
            onChange={(date) => setDeadline(date)}
            placeholder="Chọn ngày giờ"
            className="input"
          />
        </div>
      </div>

      {/* File đính kèm */}
      <div>
        <label className="label">File đính kèm</label>
        <div className="flex items-center gap-3">
          <label className="btn btn-secondary cursor-pointer">
            <MdUploadFile size={18} />
            Chọn file
            <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.jpg,.jpeg,.png" />
          </label>
          <span className="text-xs text-gray-500">PDF, Word, ảnh (tối đa 10MB/file)</span>
        </div>
        {/* Preview files */}
        {files.length > 0 && (
          <div className="mt-2 space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded">
                <span>📎 {f.name}</span>
                <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                  <MdClose size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Existing attachments */}
        {task?.attachments?.length > 0 && (
          <div className="mt-2 space-y-1">
            {task.attachments.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-primary-600 hover:underline bg-gray-50 px-3 py-1.5 rounded">
                📎 {f.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          <MdSave size={18} />
          {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo công việc')}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
