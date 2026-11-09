import { db } from "./db";
import { Problem } from "./security";
export async function searchProviders(filters: URLSearchParams) {
  const query = (filters.get("q") ?? "").trim().slice(0, 100);
  const category = filters.get("category") ?? "",
    insurance = filters.get("insurance") ?? "",
    county = filters.get("county") ?? "";
  const number = (key: string) => {
    const value = filters.get(key);
    return value ? Number(value) : null;
  };
  const maxPrice = number("maxPrice"),
    lat = number("lat"),
    lng = number("lng"),
    radius = number("radius");
  const sort = filters.get("sort") ?? "nearest";
  if (
    (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) ||
    (lng !== null && (!Number.isFinite(lng) || Math.abs(lng) > 180)) ||
    (lat === null) !== (lng === null) ||
    (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
    !["nearest", "price", "name"].includes(sort)
  )
    throw new Problem(400, "Check your search filters.");
  if (
    radius !== null &&
    (!Number.isFinite(radius) || radius <= 0 || radius > 20000)
  )
    throw new Problem(
      400,
      "Choose a distance greater than 0 and at most 20,000 km.",
    );
  if (radius !== null && lat === null)
    throw new Problem(
      400,
      "Share your location to filter by distance, or clear the distance filter.",
    );
  const { rows } = await db().query(
    `WITH candidates AS (
    SELECT p.id,p.name,p.category,p.county,p.address,p.phone,p.status,p.insurance,p.services,p.created_at,
    CASE WHEN $6::float IS NULL OR p.latitude IS NULL OR p.longitude IS NULL THEN NULL
      ELSE 6371*2*asin(least(1,sqrt(power(sin(radians(p.latitude-$6::float)/2),2)+cos(radians($6::float))*cos(radians(p.latitude))*power(sin(radians(p.longitude-$7::float)/2),2)))) END AS distance,
    (SELECT min((s->>'price')::numeric) FROM jsonb_array_elements(p.services) s
     WHERE $1='' OR p.name ILIKE '%'||$1||'%' OR s->>'name' ILIKE '%'||$1||'%') AS starting_price
    FROM portfolios p WHERE p.status='APPROVED'
    AND ($1='' OR p.name ILIKE '%'||$1||'%' OR EXISTS(SELECT 1 FROM jsonb_array_elements(p.services) s WHERE s->>'name' ILIKE '%'||$1||'%'))
    AND ($2='' OR p.category=$2) AND ($3='' OR $3=ANY(p.insurance))
    AND ($4='' OR p.county ILIKE '%'||$4||'%')
    AND ($5::numeric IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(p.services) s
      WHERE (s->>'price')::numeric <= $5 AND ($1='' OR p.name ILIKE '%'||$1||'%' OR s->>'name' ILIKE '%'||$1||'%')))
  ) SELECT * FROM candidates WHERE $8::float IS NULL OR distance<=$8
  ORDER BY CASE WHEN $9='price' THEN starting_price END ASC NULLS LAST,
    CASE WHEN $9='nearest' THEN distance END ASC NULLS LAST,name ASC,id ASC LIMIT 60`,
    [query, category, insurance, county, maxPrice, lat, lng, radius, sort],
  );
  return rows.map((p) => ({
    ...p,
    services: p.services.filter(
      (s: { name: string; price: number | null }) =>
        (!query ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())) &&
        (maxPrice === null || (s.price !== null && s.price <= maxPrice)),
    ),
  }));
}
