const ALLOWED = new Set(['movie', 'tv', 'trending', 'discover', 'search', 'genre'])

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const token = process.env.TMDB_TOKEN
    if (!token) {
        return res.status(500).json({ error: 'Server is not configured' })
    }

    const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path]

    if (!segments[0] || !ALLOWED.has(segments[0])) {
        return res.status(400).json({ error: 'Path not allowed' })
    }

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(req.query)) {
        if (key === 'path') continue
        if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
        else params.append(key, value)
    }

    const path = segments.map(encodeURIComponent).join('/')
    const url = `https://api.themoviedb.org/3/${path}?${params.toString()}`

    try {
        const upstream = await fetch(url, {
            headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
        })
        const body = await upstream.text()

        res.setHeader('Content-Type', 'application/json')
        if (upstream.ok) {
            res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
        }
        return res.status(upstream.status).send(body)
    } catch (error) {
        return res.status(502).json({ error: 'Upstream request failed' })
    }
}