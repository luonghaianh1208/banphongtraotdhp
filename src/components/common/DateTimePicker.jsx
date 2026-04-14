import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import vi from 'date-fns/locale/vi';
import { forwardRef } from 'react';

// Register Vietnamese locale
registerLocale('vi', vi);

// Custom input to bridge Tailwind styles cleanly
const CustomInput = forwardRef(({ value, onClick, onChange, placeholder, className }, ref) => (
  <input
    value={value}
    onClick={onClick}
    onChange={onChange}
    ref={ref}
    placeholder={placeholder}
    className={className}
    readOnly
  />
));
CustomInput.displayName = 'CustomInput';

const DateTimePicker = ({ selected, onChange, placeholder = "--/--/---- --:--", className = "input", minDate }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      timeCaption="Giờ"
      dateFormat="dd/MM/yyyy HH:mm"
      locale="vi"
      minDate={minDate}
      customInput={<CustomInput className={className} placeholder={placeholder} />}
      wrapperClassName="w-full"
    />
  );
};

export default DateTimePicker;
