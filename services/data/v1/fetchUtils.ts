
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
          .filter((d: any) => d.latitude && d.longitude)
          .map((d: any) => ({
            ...d,
            latitude: Number(d.latitude),
            longitude: Number(d.longitude)
          }));
    }
    throw new Error('Invalid data format received from API');
}
