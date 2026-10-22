// GET /api/quakes：最近的有感地震報告（顯著有感 + 小區域有感），新的在前
import { arr, endpoint, g, num } from '../../server/cwa';
import { intensityRank, type Quake } from '../../src/lib/cwa';

function parse(records: any, big: boolean): Quake[] {
  return arr(g(records, 'Earthquake')).map((q) => {
    const info = g(q, 'EarthquakeInfo');
    // 每個縣市只留最大震度
    const areas = new Map<string, string>();
    for (const a of arr(g(q, 'Intensity.ShakingArea'))) {
      const county = g(a, 'CountyName');
      const level = String(g(a, 'AreaIntensity') ?? '');
      if (!county || !level) continue;
      for (const c of String(county).split(/[、,]/)) {
        if (intensityRank(level) > intensityRank(areas.get(c) ?? '')) areas.set(c, level);
      }
    }
    const sorted = [...areas].map(([county, intensity]) => ({ county, intensity })).sort((a, b) => intensityRank(b.intensity) - intensityRank(a.intensity));
    return {
      no: String(g(q, 'EarthquakeNo') ?? ''),
      big,
      time: String(g(info, 'OriginTime') ?? '').replace('T', ' ').slice(0, 19),
      location: String(g(info, 'Epicenter.Location') ?? ''),
      depth: num(g(info, 'FocalDepth')),
      mag: num(g(info, 'EarthquakeMagnitude.MagnitudeValue')),
      maxIntensity: sorted[0]?.intensity ?? '',
      areas: sorted.slice(0, 8),
      web: String(g(q, 'Web') ?? ''),
      image: String(g(q, 'ReportImageURI') ?? ''),
    };
  });
}

export const onRequestGet = endpoint(
  60,
  [
    { dataset: 'E-A0015-001', params: { limit: '10' } },
    { dataset: 'E-A0016-001', params: { limit: '10' } },
  ],
  ([big, small]) => {
    const quakes = [...parse(big, true), ...parse(small, false)].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 15);
    return { quakes };
  }
);
