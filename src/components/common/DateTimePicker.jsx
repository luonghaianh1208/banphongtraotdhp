import React, { useMemo } from 'react';
import Flatpickr from 'react-flatpickr';
import { Vietnamese } from 'flatpickr/dist/l10n/vn';
import "flatpickr/dist/flatpickr.min.css";

const DateTimePicker = ({ selected, onChange, placeholder = "--/--/---- --:--", className = "input", minDate }) => {
  const options = useMemo(() => ({
    locale: Vietnamese,
    enableTime: true,
    dateFormat: "d/m/Y H:i",
    time_24hr: true,
    minDate: minDate,
    disableMobile: true, // boolean is needed
    closeOnSelect: false,
  }), [minDate]);

  return (
    <Flatpickr
      data-enable-time
      value={selected}
      onChange={([date]) => {
        if (date) onChange(date);
      }}
      options={options}
      placeholder={placeholder}
      className={`${className} bg-white`}
    />
  );
};

export default DateTimePicker;
