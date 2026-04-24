import { AppShell } from "@/components/app-shell";
import { getUserProfileTypes, requireCurrentUser } from "@/lib/auth";
import { navigationItems } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  const profileTypes = getUserProfileTypes(user);
  const visibleNavigation = navigationItems.filter((item) =>
    item.allowedProfiles.some((profile) => profileTypes.includes(profile)),
  );

  return (
    <AppShell
      userName={user.name}
      avatarFileId={user.avatarStoredFile?.id ?? null}
      profileLabels={profileTypes}
      navigationItems={visibleNavigation.map(({ href, label }) => ({ href, label }))}
    >
      {children}
    </AppShell>
  );
}
