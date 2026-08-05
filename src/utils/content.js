import { http } from '@/api/http'

// Step.ContentUrl is either an external link (pasted by the instructor, e.g. a YouTube URL)
// or a path served by our own API (e.g. "steps/{id}/content", set automatically after a file
// upload). The latter is gated by JWT auth, so a plain <video>/<a> tag can't load it directly
// (no way to attach the Authorization header) — it has to go through the authenticated http
// client and be turned into a blob URL instead.
export function isInternalContentUrl(url) {
  return !!url && !/^https?:\/\//i.test(url)
}

export async function fetchProtectedContentBlobUrl(contentUrl) {
  const response = await http.get(contentUrl, { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}
