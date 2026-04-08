CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'arcane',
    "position" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollectionCourse" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CollectionCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");
CREATE UNIQUE INDEX "CollectionCourse_collectionId_courseId_key" ON "CollectionCourse"("collectionId", "courseId");
CREATE UNIQUE INDEX "CollectionCourse_collectionId_position_key" ON "CollectionCourse"("collectionId", "position");

ALTER TABLE "CollectionCourse" ADD CONSTRAINT "CollectionCourse_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionCourse" ADD CONSTRAINT "CollectionCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
