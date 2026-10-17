import { requireStaff } from "@/lib/auth/session";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export default async function AdminTaxonomyPage() {
  await requireStaff("taxonomy");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">বিষয় ও টপিক</h1>
      <p className="mb-6 text-muted-foreground">ক্যাটাগরি → বিষয় → টপিক কাঠামো পরিচালনা করুন।</p>
      <TaxonomyManager />
    </div>
  );
}
