import { SettingsForm } from "@/components/student/settings/settings-form";
import { useUser } from "@/hooks/use-user";

/**
 * Student settings route.
 *
 * A thin page: it reads the already-resolved user from the shared query cache
 * (the student layout guarantees one) and hands it to the settings form, which
 * owns the editable state and the save mutation.
 */
export default function SettingsPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Keep your preferred name, programme and UTME subjects up to date. Your
          syllabus and practice sessions follow your subject combination.
        </p>
      </header>

      <SettingsForm user={user} />
    </div>
  );
}
