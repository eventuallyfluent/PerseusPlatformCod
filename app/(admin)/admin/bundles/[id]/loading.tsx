import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export default function LoadingBundleDetail() {
  return (
    <AdminShell title="Loading bundle" description="Preparing the bundle editor.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="space-y-4 bg-white p-8">
          <div className="h-5 w-28 animate-pulse rounded-full bg-stone-200" />
          <div className="h-12 w-2/3 animate-pulse rounded-3xl bg-stone-200" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-24 animate-pulse rounded-[24px] bg-stone-100" />
            <div className="h-24 animate-pulse rounded-[24px] bg-stone-100" />
            <div className="h-24 animate-pulse rounded-[24px] bg-stone-100" />
            <div className="h-24 animate-pulse rounded-[24px] bg-stone-100" />
          </div>
        </Card>
        <Card className="space-y-4 bg-white p-5">
          <div className="h-5 w-24 animate-pulse rounded-full bg-stone-200" />
          <div className="h-12 animate-pulse rounded-full bg-stone-100" />
          <div className="h-12 animate-pulse rounded-full bg-stone-100" />
          <div className="h-12 animate-pulse rounded-full bg-stone-100" />
        </Card>
      </div>
    </AdminShell>
  );
}
