export const metadata = { title: "Об организации" };

import { OrgName } from "@/components/org-name";

export default function AboutPage() {
  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-extrabold tracking-tight">Об организации</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Общероссийская общественная организация <OrgName /> помогает семьям с детьми и будущим
        родителям разобраться в мерах государственной поддержки — как федеральных, так и
        региональных.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Это приложение собирает меры поддержки в едином каталоге и помогает подобрать те, что
        подходят именно вашей семье.
      </p>

      <div className="mt-5 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">Важно</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Информация носит справочный характер. Точные условия и суммы уточняйте на портале
          Госуслуг и в официальных источниках, указанных в каждой мере.
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} <OrgName />
      </p>
    </div>
  );
}
