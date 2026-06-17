import { useState } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import moment from 'moment-jalaali';

interface JalaaliDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function JalaaliDatePicker({ 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  placeholder = "تاریخ را انتخاب کنید",
  disabled = false 
}: JalaaliDatePickerProps) {
  
  const [selectedDate, setSelectedDate] = useState(
    value ? moment(value, 'jYYYY/jMM/jDD').toDate() : null
  );

  const handleChange = (date: any) => {
    if (date) {
      const jalaaliDate = moment(date).format('jYYYY/jMM/jDD');
      setSelectedDate(date);
      onChange(jalaaliDate);
    } else {
      setSelectedDate(null);
      onChange('');
    }
  };

  return (
    <DatePicker
      value={selectedDate}
      onChange={handleChange}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      inputClass="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-left font-sans focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      placeholder={placeholder}
      disabled={disabled}
      minDate={minDate ? moment(minDate, 'jYYYY/jMM/jDD').toDate() : undefined}
      maxDate={maxDate ? moment(maxDate, 'jYYYY/jMM/jDD').toDate() : undefined}
      format="jYYYY/jMM/jDD"
    />
  );
}