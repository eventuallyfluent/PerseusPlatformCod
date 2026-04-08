export function resolveCollectionPublicPath(collection: { slug: string }) {
  return `/courses?collection=${encodeURIComponent(collection.slug)}`;
}
