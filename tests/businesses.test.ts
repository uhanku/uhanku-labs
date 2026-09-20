import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBusinessesDocument,
  BusinessesError,
} from "../lib/businesses";

function document(overrides: Record<string, unknown> = {}) {
  return {
    metadata: {
      dataset: "Test dataset",
      area: "Test Area",
      primary_source: "Google Maps",
      enrichment_source: "OSM",
      rules: { location: "test" },
      counts: { final_businesses: 1 },
    },
    businesses: [
      {
        key: "business-1",
        name: "Test business",
        category: null,
        secondary_category: null,
        address: null,
        locality: null,
        postal_code: null,
        phone: null,
        website: null,
        rating: null,
        review_count: null,
        hours_summary: null,
        plus_code: null,
        latitude: null,
        longitude: null,
        notes: [],
        google_maps_url: null,
        queries_discovered_via: [],
        collected_at: null,
        location_match: null,
        location_reason: null,
        smb_likelihood: null,
        smb_confidence: null,
        smb_reason: null,
        sources: ["google_maps"],
        openstreetmap: [],
      },
    ],
    ...overrides,
  };
}

test("parses a valid businesses document with nested OSM data", () => {
  const value = document();
  (value.businesses[0] as Record<string, unknown>).openstreetmap = [{
    osm_type: "node",
    osm_id: 13335648462,
    name: "Test OSM",
    category: "shop",
    address: null,
    phone: null,
    website: null,
    opening_hours: null,
    latitude: 41.1,
    longitude: -8.5,
    osm_tags: { shop: "convenience", name: "Test OSM" },
    match_name_similarity: 0.9,
    match_distance_m: 12,
  }];

  const parsed = parseBusinessesDocument(value);
  assert.equal(parsed.businesses[0].openstreetmap[0].osm_id, 13335648462);
  assert.deepEqual(parsed.businesses[0].openstreetmap[0].osm_tags, { shop: "convenience", name: "Test OSM" });
});

test("reports the path for malformed nested fields", () => {
  const value = document();
  (value.businesses[0] as Record<string, unknown>).notes = ["ok", 42];

  assert.throws(
    () => parseBusinessesDocument(value),
    (error: unknown) => error instanceof BusinessesError && error.message.includes("businesses[0].notes"),
  );
});

test("rejects duplicate business keys and invalid OSM tags", () => {
  const value = document({ businesses: [document().businesses[0], document().businesses[0]] });
  assert.throws(() => parseBusinessesDocument(value), /duplicate key/);

  const osmValue = document();
  (osmValue.businesses[0] as Record<string, unknown>).openstreetmap = [{
    osm_type: "node",
    osm_id: 1,
    name: null,
    category: null,
    address: null,
    phone: null,
    website: null,
    opening_hours: null,
    latitude: null,
    longitude: null,
    osm_tags: { shop: 4 },
    match_name_similarity: null,
    match_distance_m: null,
  }];
  assert.throws(() => parseBusinessesDocument(osmValue), /openstreetmap\[0\]\.osm_tags/);
});
