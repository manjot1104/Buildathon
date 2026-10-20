import { SettingsShell } from "@/components/app/settings-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function SecuritySettingsPage() {
  return (
    <SettingsShell
      title="Security"
      description="Sessions and account protection."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
          <p>
            You are signed in with a secure HTTP-only session cookie. Use log out from the profile menu
            to end your session on this device.
          </p>
          <p>
            Password changes and two-factor authentication can be added when account management APIs are
            enabled for your workspace.
          </p>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
