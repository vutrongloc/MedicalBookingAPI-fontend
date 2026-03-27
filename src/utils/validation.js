const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+()\-\s]{8,15}$/;

export function validateRequired(value, label) {
  if (value === undefined || value === null || `${value}`.trim() === "") {
    return `${label} là bắt buộc`;
  }
  return true;
}

export function validateEmail(value) {
  if (!value) return "Email là bắt buộc";
  return emailRegex.test(value) ? true : "Email không hợp lệ";
}

export function validatePhone(value) {
  if (!value) return true;
  return phoneRegex.test(value) ? true : "Số điện thoại không hợp lệ";
}
