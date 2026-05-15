import assert from "node:assert/strict";
import { isOwnedImageUrl, isRemoteImageCandidate, normalizeImportedImageUrl } from "@/lib/image-assets/url";

const payhipUrl =
  "https://payhip.com/cdn-cgi/image/format=auto,width=500/https://pe56d.s3.amazonaws.com/o_1grafuubi1cmt1abu1np32f1jjdc.jpg";
const encodedPayhipUrl =
  "https://payhip.com/cdn-cgi/image/format%3Dauto%2Cwidth%3D500/https%3A//pe56d.s3.amazonaws.com/o_1h63kdl14nomcke1oo91lflc7uv.jpg";
const widthlessPayhipUrl =
  "https://payhip.com/cdn-cgi/image/format%3Dauto/https%3A//pe56d.s3.amazonaws.com/o_1ifpmhegh9qb1c2b1ls81tje1ok8l.jpg";

assert.equal(
  normalizeImportedImageUrl(payhipUrl),
  "https://payhip.com/cdn-cgi/image/format=auto,width=1600/https://pe56d.s3.amazonaws.com/o_1grafuubi1cmt1abu1np32f1jjdc.jpg",
);
assert.equal(
  normalizeImportedImageUrl(encodedPayhipUrl),
  "https://payhip.com/cdn-cgi/image/format%3Dauto%2Cwidth%3D1600/https%3A//pe56d.s3.amazonaws.com/o_1h63kdl14nomcke1oo91lflc7uv.jpg",
);
assert.equal(
  normalizeImportedImageUrl(widthlessPayhipUrl),
  "https://payhip.com/cdn-cgi/image/format%3Dauto%2Cwidth%3D1600/https%3A//pe56d.s3.amazonaws.com/o_1ifpmhegh9qb1c2b1ls81tje1ok8l.jpg",
);
assert.equal(normalizeImportedImageUrl(" https://example.com/image.jpg "), "https://example.com/image.jpg");
assert.equal(isOwnedImageUrl("https://abc.public.blob.vercel-storage.com/imports/courses/test/hero.jpg"), true);
assert.equal(isOwnedImageUrl("https://example.com/image.jpg"), false);
assert.equal(isRemoteImageCandidate("https://example.com/image.jpg"), true);
assert.equal(isRemoteImageCandidate("https://abc.public.blob.vercel-storage.com/imports/courses/test/hero.jpg"), false);
assert.equal(isRemoteImageCandidate("not a url"), false);

console.log("Image asset URL checks passed");
