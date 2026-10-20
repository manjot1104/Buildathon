import { SettingsShell } from "@/components/app/settings-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationSettingsPage() {
  return (
    <SettingsShell
      title="Notification preferences"
      description="Choose how ScopePilot keeps you updated."
    >
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
          <p>In-app notifications are always available under Notifications in the sidebar.</p>
          <p>
            Email and WhatsApp delivery depends on workspace integrations. Configure providers under
            Integrations when your administrator connects them.
          </p>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
