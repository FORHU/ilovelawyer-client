import { redirect } from "next/navigation";

// Sign up lives as a tab on the unified /login page; this route keeps /signup links working.
export default function SignupRedirect() {
  redirect("/login?tab=signup");
}
