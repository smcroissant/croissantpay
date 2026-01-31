import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * App root: redirect to dashboard if signed in, else to login.
 * When app and marketing are split, the marketing site is the public home.
 */
export default async function AppRootPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (session) {
    redirect("/dashboard");
  }

  redirect("/login");
}
