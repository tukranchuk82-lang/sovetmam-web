import type { ComponentType } from "react";
import {
  Baby,
  Users,
  GraduationCap,
  User,
  Shield,
  Accessibility,
  HeartHandshake,
  School,
} from "lucide-react";
import type { SegmentId } from "@/lib/measures";

type IconType = ComponentType<{ className?: string }>;

export const SEGMENT_ICONS: Record<SegmentId, IconType> = {
  "expecting-first": Baby,
  "expecting-second": Baby,
  "expecting-third": Users,
  "expecting-fourth": Users,
  "expecting-fifth-plus": Users,
  "student-family": GraduationCap,
  "single-parent": User,
  "svo-family": Shield,
  disability: Accessibility,
  "foster-family": HeartHandshake,
  schoolchild: School,
};
