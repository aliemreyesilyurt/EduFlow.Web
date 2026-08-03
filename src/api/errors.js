export function extractErrorMessage(error, fallback = 'Bir hata oluştu, lütfen tekrar deneyin.') {
  const data = error?.response?.data

  if (!data) {
    return fallback
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.description).join(' ')
  }

  return data.description || data.detail || fallback
}
