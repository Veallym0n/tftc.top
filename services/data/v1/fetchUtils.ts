
export async function fetchWithRetry(url: string, retries = 3, backoff = 1000): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                 if (res.status >= 400 && res.status < 500 && res.status !== 429) {
                     throw new Error(`HTTP error! status: ${res.status}`);
                 }
                 throw new Error(`HTTP error! status: ${res.status}`);
            }
            // If the response is gzip-compressed (e.g. a .gz static file without
            // Content-Encoding header), decompress it manually before parsing JSON.
            const contentType = res.headers.get('content-type') ?? '';
            const isGzip =
                contentType.includes('gzip') ||
                contentType.includes('application/x-gzip') ||
                url.endsWith('.gz');
            if (isGzip) {
                // Some servers (e.g. Vite, nginx) serve .gz files with
                // Content-Encoding: gzip, so the browser transparently decompresses
                // the body before JS sees it.  In that case res.json() works directly.
                // Only fall back to manual DecompressionStream when the body is still
                // raw gzip bytes (i.e. no transparent decompression happened).
                const resClone = res.clone();
                try {
                    return await res.json();
                } catch {
                    const ds = new DecompressionStream('gzip');
                    const decompressed = resClone.body!.pipeThrough(ds);
                    const text = await new Response(decompressed).text();
                    return JSON.parse(text);
                }
            }
            return await res.json();
        } catch (err) {
            console.warn(`Fetch attempt ${i + 1} failed for ${url}`, err);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
        }
    }
}

export function processStandardResponse(data: any): any[] {
    if (Array.isArray(data)) {
        return data
          .filter((d: any) =>
            // Allow latitude/longitude of 0 (premium-only caches have 0,0 coords that
            // will be patched later); only exclude items with missing/null coords.
            (d.latitude != null && d.longitude != null) ||
            (d.postedCoordinates?.latitude != null && d.postedCoordinates?.longitude != null)
          )
          .map((d: any) => {
            const lat = d.latitude ?? d.postedCoordinates?.latitude;
            const lng = d.longitude ?? d.postedCoordinates?.longitude;
            return {
              ...d,
              latitude: Number(lat),
              longitude: Number(lng),
            };
          });
    }
    throw new Error('Invalid data format received from API');
}
