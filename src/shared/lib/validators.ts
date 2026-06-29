export function validateNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;
  const check = parseInt(code[9]);
  const sum = code.split('').slice(0, 9).reduce((acc, val, i) => acc + parseInt(val) * (10 - i), 0) % 11;
  return sum < 2 ? check === sum : check === 11 - sum;
}

export function validateNationalId(id: string): boolean {
  return /^\d{11}$/.test(id);
}

export function validateMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

export function formatPrice(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const number = typeof value === 'string' ? value.replace(/,/g, '') : value.toString();
  if (number === '' || isNaN(Number(number))) return '';
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parsePrice(formattedValue: string): number {
  return Number(formattedValue.replace(/,/g, ''));
}




