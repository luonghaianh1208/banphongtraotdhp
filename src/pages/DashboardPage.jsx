// DashboardPage — biểu đồ tổng quan (chỉ admin/manager)
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { countTasksByStatus, getOverdueByMember } from '../utils/statusUtils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MdAssignment, MdWarning, MdCheckCircle, MdPeople, MdTrendingUp } from 'react-icons/md';
import { useMemo } from 'react';

const COLORS = {
  notDue: '#10B981', // emerald-500
  nearDue: '#F59E0B', // amber-500
  urgent: '#EF4444', // red-500
  overdue: '#64748b', // slate-500
  extended: '#3B82F6', // blue-500
  completed: '#059669', // emerald-600
};

const DashboardPage = () => {
  const { tasks, loading: tl } = useTasks();
  const { users, loading: ul } = useUsers();

  if (tl || ul) return <LoadingSpinner />;

  const counts = useMemo(() => countTasksByStatus(tasks), [tasks]);
  const overdueByMember = useMemo(() => getOverdueByMember(tasks, users), [tasks, users]);

  const pieData = useMemo(() => [
    { name: 'Chưa đến hạn', value: counts.notDue, color: COLORS.notDue },
    { name: 'Gần đến hạn', value: counts.nearDue, color: COLORS.nearDue },
    { name: 'Cần gấp', value: counts.urgent, color: COLORS.urgent },
    { name: 'Quá hạn', value: counts.overdue, color: COLORS.overdue },
    { name: 'Gia hạn', value: counts.extended, color: COLORS.extended },
    { name: 'Hoàn thành', value: counts.completed, color: COLORS.completed },
  ].filter(d => d.value > 0), [counts]);

  const barData = useMemo(() => users.filter(u => u.isActive !== false).map(user => {
    const userTasks = tasks.filter(t => t.assignees?.includes(user.id));
    const done = userTasks.filter(t => t.isCompleted).length;
    const active = userTasks.filter(t => !t.isCompleted).length;
    return { name: user.displayName?.split(' ').pop() || '?', 'Hoàn thành': done, 'Đang làm': active };
  }), [users, tasks]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MdTrendingUp size={32} />
            </div>
            Tổng Quan Hệ Thống
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">
            Phân tích dữ liệu thời gian thực cho thấy hiệu suất và tiến độ của toàn bộ hệ thống quản lý.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={MdAssignment}
          label="Tổng công việc"
          value={counts.total}
          color="emerald"
          gradient="from-emerald-500/20 to-emerald-500/5"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={MdWarning}
          label="Quá hạn"
          value={counts.overdue}
          color="rose"
          gradient="from-rose-500/20 to-rose-500/5"
          iconColor="text-rose-600"
        />
        <StatCard
          icon={MdCheckCircle}
          label="Hoàn thành"
          value={counts.completed}
          color="sky"
          gradient="from-sky-500/20 to-sky-500/5"
          iconColor="text-sky-600"
        />
        <StatCard
          icon={MdPeople}
          label="Thành viên"
          value={users.filter(u => u.isActive !== false).length}
          color="amber"
          gradient="from-amber-500/20 to-amber-500/5"
          iconColor="text-amber-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Pie chart */}
        <div className="lg:col-span-2 glass-card p-8 border-white/40 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-700" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Trạng thái nhiệm vụ
          </h3>
          {pieData.length > 0 ? (
            <div className="h-[340px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      padding: '12px 16px'
                    }}
                    itemStyle={{ fontWeight: '900', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-20px]">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">Tổng cộng</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{counts.total}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[340px] text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <MdAssignment size={48} className="opacity-10 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chưa có dữ liệu thống kê</p>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="lg:col-span-3 glass-card p-8 border-white/40 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mt-16 group-hover:bg-blue-500/10 transition-colors duration-700" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Hiệu suất thành viên
          </h3>
          {barData.length > 0 ? (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis
                    dataKey="name"
                    fontSize={10}
                    fontWeight="900"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis
                    fontSize={10}
                    fontWeight="900"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.01)' }}
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      padding: '12px 16px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="rect"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{value}</span>}
                  />
                  <Bar dataKey="Hoàn thành" fill={COLORS.completed} radius={[6, 6, 0, 0]} barSize={16} animationDuration={2000} />
                  <Bar dataKey="Đang làm" fill="#CBD5E1" radius={[6, 6, 0, 0]} barSize={16} animationDuration={2000} animationBegin={500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[340px] text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <MdPeople size={48} className="opacity-10 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chưa có dữ liệu thành viên</p>
            </div>
          )}
        </div>
      </div>

      {/* Overdue by member table */}
      {overdueByMember.length > 0 && (
        <div className="glass-card overflow-hidden border-rose-200/50 dark:border-rose-900/30 shadow-2xl shadow-rose-500/5 transition-all duration-500">
          <div className="p-8 bg-gradient-to-r from-rose-50/80 to-transparent dark:from-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
            <h3 className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-[0.25em] flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/50 shadow-sm shadow-rose-500/10">
                <MdWarning size={20} />
              </div>
              Phân tích công việc quá hạn
            </h3>
            <span className="px-4 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 animate-pulse">
              Cảnh báo cao
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 w-[25%]">Thành viên</th>
                  <th className="text-center py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 w-[15%]">Số lượng</th>
                  <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Chi tiết nhiệm vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {overdueByMember.map(({ user, tasks: overTasks }) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-all duration-300 group">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                          {user.displayName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white leading-none mb-1">{user.displayName}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Người phụ trách</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-center text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-rose-600 font-black text-lg shadow-inner border border-rose-100 dark:border-rose-900/50">
                        {overTasks.length}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-wrap gap-2">
                        {overTasks.map((t, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                            {t.title}
                          </span>
                        ))}
                      </div>
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

const StatCard = ({ icon: Icon, label, value, gradient, iconColor }) => { // eslint-disable-line no-unused-vars
  return (
    <div className={`glass-card p-6 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden border-white/40 dark:border-white/5 shadow-xl hover:shadow-2xl`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-700`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 ${iconColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
            <Icon size={22} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 leading-none">{label}</span>
        </div>
        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/50 dark:bg-slate-800/50 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${gradient} w-0 group-hover:w-full transition-all duration-1000 ease-out`} />
      </div>
    </div>
  );
};

export default DashboardPage;
