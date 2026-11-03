const API_URL = 'http://127.0.0.1:8000/api'

export async function getCafes(page = 1, perPage = 9) {
  const response = await fetch(
    `${API_URL}/cafes?page=${page}&per_page=${perPage}`
  )

  if (!response.ok) {
    throw new Error('Failed to load cafes')
  }

  return await response.json()
}