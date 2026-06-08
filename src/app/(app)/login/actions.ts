"use server";

import { redirect } from "next/navigation";
import {
  setDemoUserCookie,
  clearDemoUserCookie,
  type Channel,
  type Role,
} from "@/lib/demo-auth";

export async function loginAsDemoUser(channel: Channel, role: Role) {
  await setDemoUserCookie(`${channel}:${role}`);
  redirect("/profile");
}

export async function logoutDemoUser() {
  await clearDemoUserCookie();
  redirect("/");
}
