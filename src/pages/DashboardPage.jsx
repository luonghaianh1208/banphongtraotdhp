// DashboardPage — biểu đồ tổng quan (chỉ admin/manager)
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { countTasksByStatus, getOverdueByMember } from '../utils/statusUtils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MdAssignment, MdWarning, MdCheckCircle, MdPeople } from 'react-icons/md';
import { formatDate } from '../utils/dateUtils';

const COLORS = {
  notDue: '#10B981',
  nearDue: '#F59E0B',
  urgent: '#EF4444',
  overdue: '#374151',
  extended: '#3B82F6',
  completed: '#059669',
};

const DashboardPage = () => {
  const { tasks, loading: tl } = useTasks();
  const { users, loading: ul } = useUsers();

  if (tl || ul) return <LoadingSpinner />;

  const counts = countTasksByStatus(tasks);
  const overdueByMember = getOverdueByMember(tasks, users);

  // Dữ liệu cho biểu đồ tròn
  const pieData = [
    { name: 'Chưa đến hạn', value: counts.notDue, color: COLORS.notDue },
    { name: 'Gần đến hạn', value: counts.nearDue, color: COLORS.nearDue },
    { name: 'Cần gấp', value: counts.urgent, color: COLORS.urgent },
    { name: 'Quá hạn', value: counts.overdue, color: COLORS.overdue },
    { name: 'Gia hạn', value: counts.extended, color: COLORS.extended },
    { name: 'Hoàn thành', value: counts.completed, color: COLORS.completed },
  ].filter(d => d.value > 0);

  // Dữ liệu cho biểu đồ cột theo thành viên
  const barData = users.filter(u => u.isActive !== false).map(user => {
    const userTasks = tasks.filter(t => t.assignees?.includes(user.id));
    const done = userTasks.filter(t => t.isCompleted).length;
    const active = userTasks.filter(t => !t.isCompleted).length;
    return { name: user.displayName?.split(' ').pop() || '?', 'Hoàn thành': done, 'Đang làm': active };
  });

  return (
    <div className="max-w-6xl mx-auto fade-in space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MdAssignment} label="Tổng công việc" value={counts.total} color="primary" />
        <StatCard icon={MdWarning} label="Quá hạn" value={counts.overdue} color="red" />
        <StatCard icon={MdCheckCircle} label="Hoàn thành" value={counts.completed} color="emerald" />
        <StatCard icon={MdPeople} label="Thành viên" value={users.filter(u => u.isActive !== false).length} color="blue" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Phân bổ theo trạng thái</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Bar chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Công việc theo thành viên</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Hoàn thành" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Đang làm" fill={COLORS.nearDue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Overdue by member table */}
      {overdueByMember.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
            <MdWarning size={18} /> Task quá hạn theo thành viên
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Thành viên</th>
                  <th className="text-center py-2.5 px-3 font-semibold text-gray-600">Số task quá hạn</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {overdueByMember.map(({ user, tasks: overTasks }, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{user.displayName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="badge badge-red">{overTasks.length}</span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {overTasks.map(t => t.title).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: stat card
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
};

export default DashboardPage;
