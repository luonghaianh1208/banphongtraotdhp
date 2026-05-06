import { useState, useMemo } from 'react';
import { isSameDay, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns';
import { MdAdd, MdDateRange } from 'react-icons/md';
import MiniTaskCard from './MiniTaskCard';
import PersonalTaskItem from './PersonalTaskItem';
import PersonalTaskPopup from './PersonalTaskPopup';
import EmptyState from '../common/EmptyState';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const WeeklyCalendar = ({
  weekDays, tasksByDay, userMap, onTaskClick, onApprove, canApprove,
  personalTasks, onAddPersonal, onTogglePersonal, onDeletePersonal,
  calendarMode, monthDays, monthTasksByDay, personalByDay,
}) => {
  const [popupDate, setPopupDate] = useState(null);
  const today = new Date();

  const handleAddPersonal = async (data) => {
    await onAddPersonal(data);
  };

  const days = calendarMode === 'month' ? monthDays : weekDays;
  const tByDay = calendarMode === 'month' ? monthTasksByDay : tasksByDay;

  if (calendarMode === 'month') {
    return (
      <div>
        {/* Month grid header */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAY_LABELS.map(l => (
            <div key={l} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 py-2">{l}</div>
          ))}
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {days.map((day, idx) => {
            const isToday = isSameDay(day, today);
            const isCurMonth = isSameMonth(day, today);
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tByDay[dateStr] || [];
            const pTasks = personalByDay[dateStr] || [];

            return (
              <div
                key={idx}
                onClick={() => setPopupDate({ date: dateStr, label: `${DAY_LABELS[idx % 7]} ${format(day, 'dd/MM')}` })}
                className={`min-h-[100px] p-1.5 cursor-pointer transition-all hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 ${
                  isToday ? 'bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-inset ring-emerald-500/30' : isCurMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <p className={`text-[11px] font-black mb-1 ${isToday ? 'text-emerald-600 dark:text-emerald-400' : isCurMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                  {format(day, 'd')}
                  {isToday && <span className="ml-1 text-[8px] font-black uppercase tracking-widest">Nay</span>}
                </p>
                {dayTasks.slice(0, 2).map(t => (
                  <div key={t.id} onClick={e => { e.stopPropagation(); onTaskClick(t); }}
                    className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-emerald-100/60 dark:bg-emerald-900/20 rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:bg-emerald-200/80">
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && <p className="text-[8px] font-bold text-slate-400">+{dayTasks.length - 2} việc</p>}
                {pTasks.slice(0, 2).map(t => (
                  <div key={t.id} className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100/60 dark:bg-sky-900/20 rounded px-1 py-0.5 mb-0.5 truncate">
                    ✦ {t.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {popupDate && (
          <PersonalTaskPopup
            date={popupDate.date}
            dateLabel={popupDate.label}
            onSave={handleAddPersonal}
            onClose={() => setPopupDate(null)}
          />
        )}
      </div>
    );
  }

  // === WEEK VIEW ===
  const totalWeekTasks = Object.values(tByDay).reduce((s, a) => s + a.length, 0);
  const totalPersonal = Object.values(personalByDay).reduce((s, a) => s + a.length, 0);

  if (totalWeekTasks === 0 && totalPersonal === 0) {
    return (
      <div className="py-12 glass-card">
        <EmptyState icon={MdDateRange} title="Tuần này rảnh rang!" message="Không có công việc nào. Click vào ô ngày để thêm việc cá nhân." />
      </div>
    );
  }

  return (
    <div>
      {/* Desktop grid */}
      <div className="hidden lg:grid grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const isCurrentDay = isSameDay(day, today);
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tByDay[dateStr] || [];
          const pTasks = personalByDay[dateStr] || [];

          return (
            <div key={idx} className={`rounded-2xl border-2 transition-all duration-500 min-h-[220px] flex flex-col ${
              isCurrentDay ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 hover:border-slate-300'
            }`}>
              {/* Header */}
              <div className={`px-3 py-2.5 border-b text-center ${isCurrentDay ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-500/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isCurrentDay ? 'text-emerald-600' : 'text-slate-400'}`}>{DAY_LABELS[idx]}</p>
                <p className={`text-lg font-black mt-0.5 ${isCurrentDay ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {format(day, 'd')}<span className="text-[10px] font-bold text-slate-400">/{format(day, 'MM')}</span>
                </p>
                {isCurrentDay && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Hôm nay</span>
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[400px] scrollbar-hide">
                {dayTasks.map(task => (
                  <MiniTaskCard key={task.id} task={task} userMap={userMap} onClick={() => onTaskClick(task)} onApprove={onApprove} canApprove={canApprove} />
                ))}
                {/* Personal tasks */}
                {pTasks.length > 0 && (
                  <>
                    {dayTasks.length > 0 && <div className="border-t border-dashed border-sky-200 dark:border-sky-800/50 my-1" />}
                    {pTasks.map(t => (
                      <PersonalTaskItem key={t.id} task={t} onToggle={onTogglePersonal} onDelete={onDeletePersonal} />
                    ))}
                  </>
                )}
                {dayTasks.length === 0 && pTasks.length === 0 && (
                  <div className="flex items-center justify-center h-full opacity-30">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trống</p>
                  </div>
                )}
              </div>

              {/* Add button */}
              <div className={`px-2 py-1.5 border-t ${isCurrentDay ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-slate-100 dark:border-slate-800'}`}>
                <button
                  onClick={() => setPopupDate({ date: dateStr, label: `${DAY_LABELS[idx]} ${format(day, 'dd/MM')}` })}
                  className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-bold text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all uppercase tracking-widest"
                >
                  <MdAdd size={12} /> Thêm việc
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="lg:hidden space-y-4">
        {weekDays.map((day, idx) => {
          const isCurrentDay = isSameDay(day, today);
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tByDay[dateStr] || [];
          const pTasks = personalByDay[dateStr] || [];

          return (
            <div key={idx} className={`rounded-2xl border-2 overflow-hidden ${
              isCurrentDay ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg' : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'
            }`}>
              <div className={`px-4 py-3 flex items-center justify-between ${isCurrentDay ? 'bg-emerald-500/10 border-b border-emerald-200' : 'bg-slate-50/50 border-b border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${isCurrentDay ? 'text-emerald-700' : 'text-slate-700 dark:text-slate-300'}`}>{DAY_LABELS[idx]}</span>
                  <span className={`text-xs font-bold ${isCurrentDay ? 'text-emerald-500' : 'text-slate-400'}`}>{format(day, 'dd/MM')}</span>
                  {isCurrentDay && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[9px] font-black uppercase text-emerald-600">Hôm nay</span>}
                </div>
                <button
                  onClick={() => setPopupDate({ date: dateStr, label: `${DAY_LABELS[idx]} ${format(day, 'dd/MM')}` })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all"
                ><MdAdd size={18} /></button>
              </div>
              <div className="p-3 space-y-2">
                {dayTasks.map(task => (
                  <MiniTaskCard key={task.id} task={task} userMap={userMap} onClick={() => onTaskClick(task)} onApprove={onApprove} canApprove={canApprove} />
                ))}
                {pTasks.map(t => (
                  <PersonalTaskItem key={t.id} task={t} onToggle={onTogglePersonal} onDelete={onDeletePersonal} />
                ))}
                {dayTasks.length === 0 && pTasks.length === 0 && (
                  <p className="text-center text-xs font-bold text-slate-300 dark:text-slate-600 py-4 uppercase tracking-widest">Không có việc</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {popupDate && (
        <PersonalTaskPopup date={popupDate.date} dateLabel={popupDate.label} onSave={handleAddPersonal} onClose={() => setPopupDate(null)} />
      )}
    </div>
  );
};

export default WeeklyCalendar;
