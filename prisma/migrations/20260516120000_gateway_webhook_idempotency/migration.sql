WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "gatewayId", "externalEventId"
      ORDER BY "processedAt" ASC NULLS LAST, "createdAt" ASC
    ) AS row_number
  FROM "WebhookEvent"
  WHERE "externalEventId" IS NOT NULL
)
DELETE FROM "WebhookEvent"
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "WebhookEvent_gatewayId_externalEventId_key" ON "WebhookEvent"("gatewayId", "externalEventId");
