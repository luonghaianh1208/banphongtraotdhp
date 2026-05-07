# Patterns & Conventions

Tai lieu ghi lai cac pattern ky thuat da chot de toan bo du an tuan thu.
Cap nhat lan cuoi: 2026-05-07

---

## 1. Portal Modal (createPortal)

### Van de

`MainLayout` va `UnitLayout` deu co CSS `overflow-hidden` hoac `overflow-y-auto` tren container cha.
Dieu nay tao ra **new containing block** khien `position: fixed` cua modal/popup bi gioi han
trong vung noi dung thay vi phu toan bo viewport.

Bieu hien: Popup bi cat, bi che boi sidebar/header, khong nam giua man hinh.

### Giai phap BAT BUOC

**Moi modal/popup/dialog trong du an PHAI dung `ReactDOM.createPortal` de render ra `document.body`.**

```jsx
import { createPortal } from 'react-dom';

const MyModal = ({ onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Modal content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        {/* ... noi dung ... */}
      </div>
    </div>,
    document.body
  );
};
```

### Quy tac z-index

| Layer           | z-index   | Ghi chu                              |
|-----------------|-----------|--------------------------------------|
| Sidebar mobile  | z-50      | Da co san trong MainLayout           |
| Modal cap 1     | z-[9999]  | Popup chinh (form, danh sach)        |
| Modal cap 2     | z-[10000] | Popup long trong popup (chi tiet)    |

### Checklist truoc khi code modal

- [ ] Import `createPortal` tu `react-dom`
- [ ] Wrap return cua modal voi `createPortal(..., document.body)`
- [ ] Backdrop va modal content tach biet (backdrop co `onClick={onClose}`)
- [ ] Modal content co `onClick={e => e.stopPropagation()}` hoac khong can neu backdrop tach rieng
- [ ] Dung z-index theo bang tren

### File da ap dung

- `src/components/attendance/AttendanceManagePage.jsx` — 3 modals (extend, program detail, record detail)
- `src/components/unit/UnitAttendancePage.jsx` — 1 modal (form diem danh)

---

## 2. Flatpickr DateTimePicker / TimePicker

### Quy tac

**Toan he thong PHAI dung Flatpickr** cho input ngay/gio. KHONG dung `<input type="datetime-local">` hay `<input type="time">` vi:
- Giao dien khong nhat quan giua cac trinh duyet
- Khong ho tro tieng Viet
- Style khong dong bo voi design system

### Component co san

| Component       | Duong dan                               | Su dung cho                    |
|-----------------|-----------------------------------------|--------------------------------|
| `DateTimePicker`| `src/components/common/DateTimePicker.jsx` | Chon ngay + gio (VD: deadline)|
| `TimePicker`    | `src/components/common/TimePicker.jsx`    | Chon gio (VD: gio co mat)     |

### Cach dung

```jsx
import DateTimePicker from '../common/DateTimePicker';
import TimePicker from '../common/TimePicker';

// DateTimePicker — nhan va tra ve Date object
<DateTimePicker
  selected={startDate}        // Date | null
  onChange={setStartDate}     // (date: Date) => void
  placeholder="Chon thoi gian"
  minDate={new Date()}        // optional
  className="w-full px-4 py-3 rounded-xl border ..."
/>

// TimePicker — nhan va tra ve string "HH:mm"
<TimePicker
  value={timeStr}             // string "HH:mm" | ""
  onChange={setTimeStr}       // (time: string) => void
  placeholder="Chon gio"
  className="w-full px-4 py-3 rounded-xl border ..."
/>
```

### File da ap dung

- `src/components/attendance/AttendanceManagePage.jsx` — DateTimePicker cho tao/sua chuong trinh, gia han
- `src/components/unit/UnitAttendancePage.jsx` — TimePicker cho gio co mat
- `src/components/tasks/TaskForm.jsx` — DateTimePicker cho deadline cong viec

---

## 3. Firestore Realtime Hooks

### Quy tac

Moi collection can hien thi realtime tren UI nen co 1 custom hook dung `onSnapshot`.

### Mau chuan

```jsx
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const useMyCollection = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'myCollection'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { data, loading };
};
```

### Hooks hien co

| Hook                      | Collection            | File                                      |
|---------------------------|-----------------------|-------------------------------------------|
| `useAttendancePrograms`   | attendancePrograms    | `src/hooks/useAttendancePrograms.js`      |
| `useAttendanceRecords`    | attendanceRecords     | `src/hooks/useAttendanceRecords.js`       |
| `useUnits`                | units                 | `src/hooks/useUnits.js`                   |
| `useTasks`                | tasks                 | `src/hooks/useTasks.js`                   |
| `useUsers`                | users                 | `src/hooks/useUsers.js`                   |
