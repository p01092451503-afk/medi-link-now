export interface WeatherRisk {
  temperatureRisk: number;    // 1.0~2.0
  precipitationRisk: number;  // 1.0~1.4
  affectedConditions: string[];
}

const CACHE_KEY = 'weather_risk_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30분

interface CachedWeather {
  data: WeatherRisk;
  timestamp: number;
  key: string;
}

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

function getCached(key: string): WeatherRisk | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedWeather = JSON.parse(raw);
    if (cached.key !== key) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function setCache(key: string, data: WeatherRisk): void {
  try {
    const entry: CachedWeather = { data, timestamp: Date.now(), key };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

export async function fetchWeatherRisk(lat: number, lng: number): Promise<WeatherRisk> {
  const key = getCacheKey(lat, lng);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation&timezone=Asia%2FSeoul`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API ${res.status}`);
    const json = await res.json();

    const temp = json.current?.temperature_2m ?? 20;
    const precip = json.current?.precipitation ?? 0;

    let temperatureRisk = 1.0;
    const affectedConditions: string[] = [];

    if (temp < -5) {
      temperatureRisk = 1.4;
      affectedConditions.push('심혈관', '낙상');
    } else if (temp < 0) {
      temperatureRisk = 1.2;
      affectedConditions.push('심혈관');
    } else if (temp > 33) {
      temperatureRisk = 1.6;
      affectedConditions.push('열사병', '탈수');
    } else if (temp > 30) {
      temperatureRisk = 1.2;
      affectedConditions.push('열사병');
    }

    let precipitationRisk = 1.0;
    if (precip > 10) {
      precipitationRisk = 1.3;
      affectedConditions.push('교통사고');
    } else if (precip > 5) {
      precipitationRisk = 1.15;
      affectedConditions.push('교통사고');
    }

    const result: WeatherRisk = { temperatureRisk, precipitationRisk, affectedConditions };
    setCache(key, result);
    return result;
  } catch (err) {
    console.error('Weather API error:', err);
    return { temperatureRisk: 1.0, precipitationRisk: 1.0, affectedConditions: [] };
  }
}
