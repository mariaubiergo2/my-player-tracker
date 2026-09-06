import { getCurrentUser } from "@/lib/auth";
import { getTranslationsServer } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import NexaLanding from "@/components/landing/NexaLanding";

export async function generateMetadata() {
  const t = await getTranslationsServer();
  return {
    title: t("landing.meta.title"),
    description: t("landing.meta.desc"),
  };
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    switch (user.role) {
      case "PLAYER":
        redirect("/player");
      case "GOAL_KEEPER":
        redirect("/goalkeeper");
      case "TRAINER":
        redirect("/staff");
      case "ADMIN":
        redirect("/admin");
      default:
        break;
    }
  }

  return <NexaLanding />;
}
