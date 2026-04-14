import React from 'react';
import Flatpickr from 'react-flatpickr';
import { Vietnamese } from 'flatpickr/dist/l10n/vn';
import "flatpickr/dist/flatpickr.min.css";

const DateTimePicker = ({ selected, onChange, placeholder = "--/--/---- --:--", className = "input", minDate }) => {
  return (
    <Flatpickr
      data-enable-time
      value={selected}
      onChange={([date]) => {
        if (date) onChange(date);
      }}
      options={{
        locale: Vietnamese,
        enableTime: true,
        dateFormat: "d/m/Y H:i",
        time_24hr: true,
        minDate: minDate,
        disableMobile: "true", // Ngăn điện thoại mở giao diện gốc nếu muốn giữ bánh răng của flatpickr
      }}
      placeholder={placeholder}
      className={`${className} bg-white`}
    />
  );
};

export default DateTimePicker;
