// Best-effort conversion of a common share URL (YouTube/Vimeo) into its embeddable form.
// Returns null when the URL doesn't match a known pattern, so callers can fall back to
// a plain <video> tag or a direct link instead.
export function toEmbedUrl(url) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.has('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`
    }

    if (parsed.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${parsed.pathname}`
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }

    return null
  } catch {
    return null
  }
}
