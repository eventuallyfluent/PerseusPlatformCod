export function resolveCollectionPublicPath(collection: { slug: string }) {
  return `/collections/${collection.slug}`;
}
