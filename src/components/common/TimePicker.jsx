import React, { useMemo } from 'react';
import Flatpickr from 'react-flatpickr';
import { Vietnamese } from 'flatpickr/dist/l10n/vn';
import "flatpickr/dist/flatpickr.min.css";

const TimePicker = ({ value, onChange, placeholder = "HH:MM", className = "input" }) => {
  const options = useMemo(() => ({
    locale: Vietnamese,
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    disableMobile: true,
  }), []);

  return (
    <Flatpickr
      data-enable-time
      value={value ? `2026-01-01T${value}` : undefined}
      onChange={([date]) => {
        if (date) {
          const h = String(date.getHours()).padStart(2, '0');
          const m = String(date.getMinutes()).padStart(2, '0');
          onChange(`${h}:${m}`);
        }
      }}
      options={options}
      placeholder={placeholder}
      className={`${className} bg-white`}
    />
  );
};

export default TimePicker;
