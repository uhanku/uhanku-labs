import { Prisma, type Prisma as PrismaTypes } from "@/generated/prisma/client";

import { prisma } from "./prisma";

export interface OpenStreetMapRecord {
  osm_type: string;
  osm_id: number;
  name: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  osm_tags: Record<string, string> | null;
  match_name_similarity: number | null;
  match_distance_m: number | null;
}

export interface Business {
  key: string;
  name: string;
  category: string | null;
  secondary_category: string | null;
  address: string | null;
  locality: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  hours_summary: string | null;
  plus_code: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string[];
  google_maps_url: string | null;
  queries_discovered_via: string[];
  collected_at: string | null;
  location_match: string | null;
  location_reason: string | null;
  smb_likelihood: string | null;
  smb_confidence: string | null;
  smb_reason: string | null;
  sources: string[];
  openstreetmap: OpenStreetMapRecord[];
}

export interface BusinessesMetadata {
  dataset: string;
  area: string;
  primary_source: string;
  enrichment_source: string;
  rules: Record<string, string>;
  counts: Record<string, number>;
}

export interface BusinessesDataset {
  metadata: BusinessesMetadata;
  businesses: Business[];
}

export class BusinessesError extends Error {
  constructor(
    message: string,
    public readonly code: "missing" | "invalid",
  ) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(path: string, expected: string): never {
  throw new BusinessesError(`${path} must be ${expected}.`, "invalid");
}

function requiredString(value: unknown, path: string, maxLength = 2048): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    invalid(path, `a non-empty string of at most ${maxLength} characters`);
  }
  return value;
}

function nullableString(value: unknown, path: string, maxLength = 2048): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > maxLength) invalid(path, `a string of at most ${maxLength} characters or null`);
  return value;
}

function nullableNumber(value: unknown, path: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) invalid(path, "a finite number or null");
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) invalid(path, "an array of strings");
  return value as string[];
}

function stringRecord(value: unknown, path: string): Record<string, string> {
  if (!isRecord(value) || Object.values(value).some((item) => typeof item !== "string")) invalid(path, "an object containing only string values");
  return value as Record<string, string>;
}

function parseOsmRecord(value: unknown, path: string): OpenStreetMapRecord {
  if (!isRecord(value)) invalid(path, "an object");
  const osmId = value.osm_id;
  if (typeof osmId !== "number" || !Number.isSafeInteger(osmId) || osmId < 0) invalid(`${path}.osm_id`, "a non-negative safe integer");
  return {
    osm_type: requiredString(value.osm_type, `${path}.osm_type`, 32),
    osm_id: osmId,
    name: nullableString(value.name, `${path}.name`, 255),
    category: nullableString(value.category, `${path}.category`, 255),
    address: nullableString(value.address, `${path}.address`),
    phone: nullableString(value.phone, `${path}.phone`, 128),
    website: nullableString(value.website, `${path}.website`),
    opening_hours: nullableString(value.opening_hours, `${path}.opening_hours`),
    latitude: nullableNumber(value.latitude, `${path}.latitude`),
    longitude: nullableNumber(value.longitude, `${path}.longitude`),
    osm_tags: value.osm_tags === null ? null : stringRecord(value.osm_tags, `${path}.osm_tags`),
    match_name_similarity: nullableNumber(value.match_name_similarity, `${path}.match_name_similarity`),
    match_distance_m: nullableNumber(value.match_distance_m, `${path}.match_distance_m`),
  };
}

function parseBusiness(value: unknown, index: number): Business {
  const path = `businesses[${index}]`;
  if (!isRecord(value)) invalid(path, "an object");
  const openstreetmap = value.openstreetmap;
  if (!Array.isArray(openstreetmap)) invalid(`${path}.openstreetmap`, "an array");
  return {
    key: requiredString(value.key, `${path}.key`, 255),
    name: requiredString(value.name, `${path}.name`, 255),
    category: nullableString(value.category, `${path}.category`, 255),
    secondary_category: nullableString(value.secondary_category, `${path}.secondary_category`, 255),
    address: nullableString(value.address, `${path}.address`),
    locality: nullableString(value.locality, `${path}.locality`, 255),
    postal_code: nullableString(value.postal_code, `${path}.postal_code`, 32),
    phone: nullableString(value.phone, `${path}.phone`, 128),
    website: nullableString(value.website, `${path}.website`),
    rating: nullableNumber(value.rating, `${path}.rating`),
    review_count: nullableNumber(value.review_count, `${path}.review_count`),
    hours_summary: nullableString(value.hours_summary, `${path}.hours_summary`),
    plus_code: nullableString(value.plus_code, `${path}.plus_code`, 128),
    latitude: nullableNumber(value.latitude, `${path}.latitude`),
    longitude: nullableNumber(value.longitude, `${path}.longitude`),
    notes: stringArray(value.notes, `${path}.notes`),
    google_maps_url: nullableString(value.google_maps_url, `${path}.google_maps_url`),
    queries_discovered_via: stringArray(value.queries_discovered_via, `${path}.queries_discovered_via`),
    collected_at: nullableString(value.collected_at, `${path}.collected_at`, 64),
    location_match: nullableString(value.location_match, `${path}.location_match`, 64),
    location_reason: nullableString(value.location_reason, `${path}.location_reason`),
    smb_likelihood: nullableString(value.smb_likelihood, `${path}.smb_likelihood`, 64),
    smb_confidence: nullableString(value.smb_confidence, `${path}.smb_confidence`, 64),
    smb_reason: nullableString(value.smb_reason, `${path}.smb_reason`),
    sources: stringArray(value.sources, `${path}.sources`),
    openstreetmap: openstreetmap.map((record, recordIndex) => parseOsmRecord(record, `${path}.openstreetmap[${recordIndex}]`)),
  };
}

export function parseBusinessesDocument(input: unknown): BusinessesDataset {
  if (!isRecord(input) || !isRecord(input.metadata) || !Array.isArray(input.businesses)) {
    throw new BusinessesError("The file is not a valid businesses document.", "invalid");
  }
  const metadata = input.metadata;
  const rules = stringRecord(metadata.rules, "metadata.rules");
  const countValues = metadata.counts;
  if (!isRecord(countValues) || Object.values(countValues).some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    invalid("metadata.counts", "an object containing only finite numbers");
  }
  const businesses = input.businesses.map(parseBusiness);
  const keys = new Set<string>();
  for (const business of businesses) {
    if (keys.has(business.key)) throw new BusinessesError(`businesses contains duplicate key "${business.key}".`, "invalid");
    keys.add(business.key);
  }
  return {
    metadata: {
      dataset: requiredString(metadata.dataset, "metadata.dataset", 255),
      area: requiredString(metadata.area, "metadata.area", 255),
      primary_source: requiredString(metadata.primary_source, "metadata.primary_source", 255),
      enrichment_source: requiredString(metadata.enrichment_source, "metadata.enrichment_source", 255),
      rules,
      counts: countValues as Record<string, number>,
    },
    businesses,
  };
}

export function toDatasetCreate(dataset: BusinessesDataset, source: string): PrismaTypes.BusinessDatasetCreateInput {
  return {
    source,
    dataset: dataset.metadata.dataset,
    area: dataset.metadata.area,
    primarySource: dataset.metadata.primary_source,
    enrichmentSource: dataset.metadata.enrichment_source,
    rules: dataset.metadata.rules,
    counts: dataset.metadata.counts,
    active: true,
    businesses: {
      create: dataset.businesses.map((business) => ({
        key: business.key,
        name: business.name,
        category: business.category,
        secondaryCategory: business.secondary_category,
        address: business.address,
        locality: business.locality,
        postalCode: business.postal_code,
        phone: business.phone,
        website: business.website,
        rating: business.rating,
        reviewCount: business.review_count,
        hoursSummary: business.hours_summary,
        plusCode: business.plus_code,
        latitude: business.latitude,
        longitude: business.longitude,
        notes: business.notes,
        googleMapsUrl: business.google_maps_url,
        queriesDiscoveredVia: business.queries_discovered_via,
        collectedAt: business.collected_at,
        locationMatch: business.location_match,
        locationReason: business.location_reason,
        smbLikelihood: business.smb_likelihood,
        smbConfidence: business.smb_confidence,
        smbReason: business.smb_reason,
        sources: business.sources,
        openstreetmap: {
          create: business.openstreetmap.map((record) => ({
            osmType: record.osm_type,
            osmId: BigInt(record.osm_id),
            name: record.name,
            category: record.category,
            address: record.address,
            phone: record.phone,
            website: record.website,
            openingHours: record.opening_hours,
            latitude: record.latitude,
            longitude: record.longitude,
            osmTags: record.osm_tags === null ? Prisma.JsonNull : record.osm_tags,
            matchNameSimilarity: record.match_name_similarity,
            matchDistanceM: record.match_distance_m,
          })),
        },
      })),
    },
  };
}

type BusinessWithOsm = PrismaTypes.BusinessGetPayload<{ include: { openstreetmap: true } }>;

function jsonArray<T>(value: PrismaTypes.JsonValue, path: string): T[] {
  if (!Array.isArray(value)) throw new BusinessesError(`${path} is not an array in the database.`, "invalid");
  return value as T[];
}

function serializeBusiness(business: BusinessWithOsm): Business {
  return {
    key: business.key,
    name: business.name,
    category: business.category,
    secondary_category: business.secondaryCategory,
    address: business.address,
    locality: business.locality,
    postal_code: business.postalCode,
    phone: business.phone,
    website: business.website,
    rating: business.rating,
    review_count: business.reviewCount,
    hours_summary: business.hoursSummary,
    plus_code: business.plusCode,
    latitude: business.latitude,
    longitude: business.longitude,
    notes: jsonArray<string>(business.notes, `business ${business.key}.notes`),
    google_maps_url: business.googleMapsUrl,
    queries_discovered_via: jsonArray<string>(business.queriesDiscoveredVia, `business ${business.key}.queries_discovered_via`),
    collected_at: business.collectedAt,
    location_match: business.locationMatch,
    location_reason: business.locationReason,
    smb_likelihood: business.smbLikelihood,
    smb_confidence: business.smbConfidence,
    smb_reason: business.smbReason,
    sources: jsonArray<string>(business.sources, `business ${business.key}.sources`),
    openstreetmap: business.openstreetmap.map((record) => ({
      osm_type: record.osmType,
      osm_id: Number(record.osmId),
      name: record.name,
      category: record.category,
      address: record.address,
      phone: record.phone,
      website: record.website,
      opening_hours: record.openingHours,
      latitude: record.latitude,
      longitude: record.longitude,
      osm_tags: record.osmTags as Record<string, string> | null,
      match_name_similarity: record.matchNameSimilarity,
      match_distance_m: record.matchDistanceM,
    })),
  };
}

export async function loadActiveBusinesses(): Promise<BusinessesDataset | null> {
  const dataset = await prisma.businessDataset.findFirst({
    where: { active: true },
    orderBy: { importedAt: "desc" },
    include: { businesses: { orderBy: { id: "asc" }, include: { openstreetmap: { orderBy: { id: "asc" } } } } },
  });
  if (!dataset) return null;
  return {
    metadata: {
      dataset: dataset.dataset,
      area: dataset.area,
      primary_source: dataset.primarySource,
      enrichment_source: dataset.enrichmentSource,
      rules: dataset.rules as Record<string, string>,
      counts: dataset.counts as Record<string, number>,
    },
    businesses: dataset.businesses.map(serializeBusiness),
  };
}
