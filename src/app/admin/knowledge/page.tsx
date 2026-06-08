import { KnowledgeUploadStub } from "@/components/admin/knowledge-upload-stub";

export const metadata = { title: "База знаний" };

export default function KnowledgePage() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-extrabold tracking-tight">База знаний</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Загружайте PDF, DOC, картинки и видео с описанием мер поддержки.
        AI разберёт содержимое и автоматически свяжет с подходящими мерами в
        каталоге.
      </p>

      <div className="mt-5">
        <KnowledgeUploadStub />
      </div>

      <p className="mt-6 rounded-xl border border-amber-300/40 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
        В прототипе файлы существуют только в этой вкладке — никуда не уходят.
        В боевой версии: загрузка в S3 + автообработка нейросетью.
      </p>
    </div>
  );
}
