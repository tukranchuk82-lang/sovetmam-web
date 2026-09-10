import { MapPin, Phone, Mail, Globe } from "lucide-react";
import type { RegionalRepresentative } from "@/lib/representatives";

/**
 * Контакты представителя — общее содержимое для баннера над подборкой и
 * для всплывающей карточки из карточки меры. Само не решает, где оно
 * стоит (баннер/модалка) — просто список контактов.
 */
export function RepresentativeDetails({
  representative,
}: {
  representative: RegionalRepresentative;
}) {
  const { description, address, phone, email, website } = representative;
  return (
    <div className="space-y-2.5">
      {description && (
        <p className="text-sm leading-relaxed text-[#4D4D4D]">{description}</p>
      )}
      <div className="space-y-1.5 text-sm">
        {address && (
          <p className="flex items-start gap-2 text-[#4D4D4D]">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#8E1D2C]" />
            <span>{address}</span>
          </p>
        )}
        {phone && (
          <p className="flex items-start gap-2">
            <Phone className="mt-0.5 size-4 shrink-0 text-[#8E1D2C]" />
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-[#1B3A6B] hover:underline">
              {phone}
            </a>
          </p>
        )}
        {email && (
          <p className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-[#8E1D2C]" />
            <a href={`mailto:${email}`} className="text-[#1B3A6B] hover:underline">
              {email}
            </a>
          </p>
        )}
        {website && (
          <p className="flex items-start gap-2">
            <Globe className="mt-0.5 size-4 shrink-0 text-[#8E1D2C]" />
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[#1B3A6B] hover:underline"
            >
              {website}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
