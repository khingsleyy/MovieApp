const ALLOWED = new Set(['movie', 'tv', 'trending', 'discover', 'search', 'genre'])

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const token = process.env.TMDB_TOKEN
    if (!token) {
        return res.status(500).json({ error: 'Server is not configured' })
    }

    const { p, ...rest } = req.query
    const path = (Array.isArray(p) ? p[0] : p) || ''
    const first = path.split('/').filter(Boolean)[0]

    if (!first || !ALLOWED.has(first) || path.includes('..')) {
        return res.status(400).json({ error: 'Path not allowed' })
    }

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(rest)) {
        if (Array.isArray(value)) value.forEach((v) => params.append(key, v))
        else params.append(key, value)
    }

    const url = `https://api.themoviedb.org/3/${path.replace(/^\/+/, '')}?${params.toString()}`

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