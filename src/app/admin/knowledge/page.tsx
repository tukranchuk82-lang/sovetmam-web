import { FolderInput } from "lucide-react";
import { KnowledgeUploadStub } from "@/components/admin/knowledge-upload-stub";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "База знаний" };

export default function KnowledgePage() {
  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<FolderInput />}
        title="База знаний"
        description="Загружайте PDF, DOC, картинки и видео с описанием мер поддержки. AI разберёт содержимое и автоматически свяжет с подходящими мерами в каталоге."
      />

      <div className="mt-5">
        <KnowledgeUploadStub />
      </div>

      <p className="mt-6 rounded-xl border border-amber-300/40 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
        Раздел в разработке: загруженные файлы пока не сохраняются. Позже —
        загрузка в хранилище и автообработка нейросетью.
      </p>
    </div>
  );
}
