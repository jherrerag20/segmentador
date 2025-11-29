// src/app/auth/page.tsx
import { redirect } from "next/navigation";

export default function AuthIndex() {
  redirect("/auth/login");
}