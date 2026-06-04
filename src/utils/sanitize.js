export function sanitizePrice(value) {
  const num = parseFloat(value)
  return isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100
}

export function sanitizeQuantity(value) {
  const num = parseInt(value, 10)
  return isNaN(num) || num < 1 ? 1 : num
}

export function sanitizeString(value) {
  return String(value).trim().slice(0, 100)
}
