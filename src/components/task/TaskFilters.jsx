// TaskFilters — bộ lọc task: search, assignee, status, priority, date range
import { MdSearch, MdFilterList, MdClear } from 'react-icons/md';
import { useTaskConfig } from '../../context/TaskConfigContext';

const TaskFilters = ({ filters, setFilters, users }) => {
  const { categories, priorities } = useTaskConfig();

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', assignee: '', status: '', priority: '', category: '', dateFrom: '', dateTo: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="card p-3 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={e => handleChange('search', e.target.value)}
            className="input pl-9"
            placeholder="Tìm kiếm công việc..."
          />
        </div>

        {/* Người thực hiện */}
        <select value={filters.assignee} onChange={e => handleChange('assignee', e.target.value)} className="input w-auto min-w-[150px]">
          <option value="">Tất cả người</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>

        {/* Trạng thái */}
        <select value={filters.status} onChange={e => handleChange('status', e.target.value)} className="input w-auto min-w-[150px]">
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang thực hiện</option>
          <option value="notDue">● Chưa đến hạn</option>
          <option value="nearDue">● Gần đến hạn</option>
          <option value="urgent">● Cần hoàn thành gấp</option>
          <option value="overdue">● Quá hạn</option>
          <option value="extended">● Gia hạn</option>
          <option value="completed">● Hoàn thành</option>
        </select>

        {/* Ưu tiên */}
        <select value={filters.priority} onChange={e => handleChange('priority', e.target.value)} className="input w-auto min-w-[120px]">
          <option value="">Tất cả ưu tiên</option>
          {priorities.map(p => (
            <option key={p.id} value={p.id}>● {p.name}</option>
          ))}
        </select>

        {/* Phân loại */}
        <select value={filters.category || ''} onChange={e => handleChange('category', e.target.value)} className="input w-auto min-w-[130px]">
          <option value="">Tất cả phân loại</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>● {c.name}</option>
          ))}
        </select>

        {/* Date range */}
        <input type="date" value={filters.dateFrom} onChange={e => handleChange('dateFrom', e.target.value)} className="input w-auto" title="Từ ngày" aria-label="Lọc từ ngày" />
        <input type="date" value={filters.dateTo} onChange={e => handleChange('dateTo', e.target.value)} className="input w-auto" title="Đến ngày" aria-label="Lọc đến ngày" />

        {/* Clear */}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn btn-ghost text-gray-500">
            <MdClear size={18} /> Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;
