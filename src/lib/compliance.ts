const patterns = [/\b(you|client) should\b/i,/\b(buy|sell|reallocate|increase|decrease)\b.{0,24}\b(position|holding|allocation|exposure)\b/i,/\bwe recommend\b/i,/\bguaranteed\b/i,/\bwill outperform\b/i];
export function findRecommendationRisk(text: string) { return patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source) }
export async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("") }
