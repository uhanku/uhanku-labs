"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  Business,
  BusinessesDataset,
  OpenStreetMapRecord,
} from "@/lib/businesses";

import styles from "./Businesses.module.css";

type SortKey = "name" | "rating" | "reviews";

const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "rating", label: "Highest rating" },
  { value: "reviews", label: "Most reviews" },
];

const MAX_HOURS_PREVIEW_LENGTH = 44;

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatRating(rating: number) {
  return Number.isInteger(rating) ? rating.toString() : rating.toFixed(1);
}

function formatCollectedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ensureScheme(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function hoursLines(business: Business) {
  if (!business.hours_summary) return [];

  return business.hours_summary
    .split(";")
    .map((line) => line.trim().replace(/: $/, ""))
    .filter(Boolean);
}

function shortHours(business: Business) {
  const lines = hoursLines(business);
  if (lines.length === 0) return null;

  const first = lines[0];
  return first.length > MAX_HOURS_PREVIEW_LENGTH
    ? `${first.slice(0, MAX_HOURS_PREVIEW_LENGTH)}…`
    : first;
}

function openStreetMapTagRows(record: OpenStreetMapRecord) {
  if (!record.osm_tags) return [];

  return Object.entries(record.osm_tags).sort(([a], [b]) => a.localeCompare(b));
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`${styles.sourceBadge} ${source === "openstreetmap" ? styles.sourceOsm : ""}`}>
      {source === "google_maps" ? "GOOGLE MAPS" : "OPENSTREETMAP"}
    </span>
  );
}

function BusinessPreview({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const hours = hoursLines(business);

  return (
    <div className={styles.drawer} role="dialog" aria-modal="true" aria-label={`${business.name} preview`}>
      <div className={styles.drawerHeader}>
        <div>
          <p className={styles.eyebrow}>BUSINESS / PREVIEW</p>
          <h2 className={styles.drawerTitle}>{business.name}</h2>
          {business.category ? (
            <p className={styles.drawerCategory}>
              {business.category}
              {business.secondary_category ? ` · ${business.secondary_category}` : ""}
            </p>
          ) : null}
        </div>

        <button className={styles.drawerClose} type="button" onClick={onClose} aria-label="Close preview">
          ×
        </button>
      </div>

      <div className={styles.drawerBody}>
        <div className={styles.ratingRow}>
          {business.rating !== null ? (
            <span className={styles.rating}>
              ★ {formatRating(business.rating)}
              {business.review_count !== null ? ` (${business.review_count})` : ""}
            </span>
          ) : (
            <span className={styles.noRating}>No reviews yet</span>
          )}

          <span className={styles.sourceRow}>
            {business.sources.map((source) => (
              <SourceBadge key={source} source={source} />
            ))}
          </span>
        </div>

        <dl className={styles.detailGrid}>
          <div>
            <dt>ADDRESS</dt>
            <dd>{business.address ?? "—"}</dd>
          </div>

          <div>
            <dt>LOCALITY</dt>
            <dd>
              {[business.locality, business.postal_code].filter(Boolean).join(" · ") || "—"}
            </dd>
          </div>

          <div>
            <dt>PLUS CODE</dt>
            <dd>{business.plus_code ?? "—"}</dd>
          </div>

          <div>
            <dt>COORDINATES</dt>
            <dd>
              {business.latitude !== null && business.longitude !== null
                ? `${business.latitude.toFixed(6)}, ${business.longitude.toFixed(6)}`
                : "—"}
            </dd>
          </div>

          <div>
            <dt>PHONE</dt>
            <dd>
              {business.phone ? (
                <a className={styles.previewLink} href={`tel:${business.phone}`}>
                  {business.phone}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <div>
            <dt>WEBSITE</dt>
            <dd>
              {business.website ? (
                <a
                  className={styles.previewLink}
                  href={ensureScheme(business.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {business.website}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>

        <section className={styles.section}>
          <h3 className={styles.sectionLabel}>OPENING HOURS</h3>
          {hours.length > 0 ? (
            <ul className={styles.hoursList}>
              {hours.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.sectionEmpty}>Not available.</p>
          )}
        </section>

        {business.notes.length > 0 ? (
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>NOTES</h3>
            <ul className={styles.notesList}>
              {business.notes.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.section}>
          <h3 className={styles.sectionLabel}>DISCOVERY</h3>
          {business.queries_discovered_via.length > 0 ? (
            <ul className={styles.notesList}>
              {business.queries_discovered_via.map((query, index) => (
                <li key={`${query}-${index}`}>{query}</li>
              ))}
            </ul>
          ) : null}
          {business.collected_at ? (
            <p className={styles.metaLine}>Collected on {formatCollectedAt(business.collected_at)}.</p>
          ) : null}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionLabel}>DATA QUALITY</h3>
          {business.location_match ? (
            <p className={styles.metaLine}>
              Location match: <strong>{business.location_match}</strong>
              {business.location_reason ? ` — ${business.location_reason}` : ""}.
            </p>
          ) : null}
          {business.smb_likelihood ? (
            <p className={styles.metaLine}>
              SMB signal: <strong>{business.smb_likelihood}</strong> ({business.smb_confidence})
              {business.smb_reason ? ` — ${business.smb_reason}` : ""}.
            </p>
          ) : null}
        </section>

        {business.openstreetmap.length > 0 ? (
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>OPENSTREETMAP ENRICHMENT</h3>

            {business.openstreetmap.map((record, index) => (
              <div key={`${record.osm_type}-${record.osm_id}-${index}`} className={styles.osmRecord}>
                <p className={styles.metaLine}>
                  {record.name ?? "Unnamed"} — {record.osm_type} #{record.osm_id}
                  {record.match_name_similarity !== null
                    ? ` · match ${Math.round(record.match_name_similarity * 100)}%`
                    : ""}
                  {record.match_distance_m !== null
                    ? ` · ${Math.round(record.match_distance_m)} m`
                    : ""}
                </p>

                {record.category ? <p className={styles.metaLine}>Category: {record.category}.</p> : null}
                {record.address ? <p className={styles.metaLine}>{record.address}</p> : null}
                {record.phone ? (
                  <p className={styles.metaLine}>
                    <a className={styles.previewLink} href={`tel:${record.phone}`}>
                      {record.phone}
                    </a>
                  </p>
                ) : null}
                {record.website ? (
                  <p className={styles.metaLine}>
                    <a
                      className={styles.previewLink}
                      href={ensureScheme(record.website)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {record.website}
                    </a>
                  </p>
                ) : null}
                {record.opening_hours ? (
                  <p className={styles.metaLine}>Hours: {record.opening_hours}.</p>
                ) : null}

                {openStreetMapTagRows(record).length > 0 ? (
                  <ul className={styles.tagList}>
                    {openStreetMapTagRows(record).map(([tag, value]) => (
                      <li key={tag}>
                        <span>{tag}</span> {value}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {business.google_maps_url ? (
          <a
            className={styles.mapsLink}
            href={business.google_maps_url}
            target="_blank"
            rel="noreferrer"
          >
            OPEN IN GOOGLE MAPS →
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function BusinessesExplorer({
  dataset,
}: {
  dataset: BusinessesDataset;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const businesses = dataset.businesses;
  const selected = selectedKey ? businesses.find((b) => b.key === selectedKey) ?? null : null;

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedKey(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();

    for (const business of businesses) {
      const key = business.category ?? "Uncategorized";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB, "pt"));
  }, [businesses]);

  const visible = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    const filtered = businesses.filter((business) => {
      if (category && (business.category ?? "Uncategorized") !== category) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        business.name,
        business.category,
        business.secondary_category,
        business.address,
        business.locality,
        business.postal_code,
      ]
        .filter(Boolean)
        .join(" ");

      return normalizeSearch(haystack).includes(normalizedQuery);
    });

    return filtered.sort((a, b) => {
      if (sort === "rating") {
        if (a.rating === null && b.rating === null) return 0;
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        return b.rating - a.rating;
      }

      if (sort === "reviews") {
        if (a.review_count === null && b.review_count === null) return 0;
        if (a.review_count === null) return 1;
        if (b.review_count === null) return -1;
        return b.review_count - a.review_count;
      }

      return a.name.localeCompare(b.name, "pt");
    });
  }, [businesses, query, category, sort]);

  const metadata = dataset.metadata;

  return (
    <>
      <section className={styles.statsRow} aria-label="Dataset summary">
        <div>
          <span className={styles.statValue}>{metadata.counts.final_businesses ?? businesses.length}</span>
          <span className={styles.statLabel}>BUSINESSES</span>
        </div>
        <div>
          <span className={styles.statValue}>{categories.length}</span>
          <span className={styles.statLabel}>CATEGORIES</span>
        </div>
        <div>
          <span className={styles.statValue}>{metadata.counts.businesses_enriched_from_osm ?? 0}</span>
          <span className={styles.statLabel}>OSM-ENRICHED</span>
        </div>
        <div className={styles.statSource}>
          <span className={styles.statValue}>{metadata.area}</span>
          <span className={styles.statLabel}>
            {metadata.primary_source} + {metadata.enrichment_source}
          </span>
        </div>
      </section>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, category, address…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search businesses"
        />

        <select
          className={styles.select}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          aria-label="Sort businesses"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className={styles.resultCount} role="status">
        Showing <strong>{visible.length}</strong> of {businesses.length} businesses
        {category ? ` in "${category}"` : ""}
        {query.trim() ? ` matching "${query.trim()}"` : ""}.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NAME</th>
              <th>CATEGORY</th>
              <th>RATING</th>
              <th>PHONE</th>
              <th>WEBSITE</th>
              <th>ADDRESS</th>
              <th>HOURS</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((business) => {
              const hours = shortHours(business);

              return (
                <tr
                  key={business.key}
                  className={styles.row}
                  tabIndex={0}
                  role="button"
                  aria-label={`Preview ${business.name}`}
                  onClick={() => setSelectedKey(business.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedKey(business.key);
                    }
                  }}
                >
                  <td>
                    <span className={styles.businessName}>{business.name}</span>
                  </td>
                  <td>{business.category ?? "—"}</td>
                  <td>
                    {business.rating !== null ? (
                      <span className={styles.rating}>
                        ★ {formatRating(business.rating)}
                        {business.review_count !== null ? ` (${business.review_count})` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {business.phone ? (
                      <a
                        className={styles.cellLink}
                        href={`tel:${business.phone}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {business.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {business.website ? (
                      <a
                        className={styles.cellLink}
                        href={ensureScheme(business.website)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        visit ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={styles.addressCell}>{business.address ?? "—"}</td>
                  <td className={styles.hoursCell} title={business.hours_summary ?? undefined}>
                    {hours ?? "—"}
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 ? (
              <tr>
                <td className={styles.emptyState} colSpan={7}>
                  No businesses match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div
          className={styles.backdrop}
          onClick={() => setSelectedKey(null)}
          aria-hidden="true"
        >
          <div onClick={(event) => event.stopPropagation()}>
            <BusinessPreview business={selected} onClose={() => setSelectedKey(null)} />
          </div>
        </div>
      ) : null}
    </>
  );
}