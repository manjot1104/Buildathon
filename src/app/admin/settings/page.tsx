import {
  isAiConfigured,
  isBillingConfigured,
  isEmailConfigured,
  isWhatsAppConfigured,
} from "@/lib/config/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const rows = [
    { name: "Email (SMTP)", status: isEmailConfigured() ? "configured" : "not_connected" },
    { name: "AI provider", status: isAiConfigured() ? "configured" : "not_connected" },
    { name: "WhatsApp Cloud API", status: isWhatsAppConfigured() ? "configured" : "not_connected" },
    { name: "Billing (Stripe)", status: isBillingConfigured() ? "configured" : "not_connected" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Platform settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {rows.map((r) => (
            <div key={r.name} className="flex justify-between border-b border-slate-100 py-2">
              <span>{r.name}</span>
              <span
                className={
                  r.status === "configured" ? "text-green-700" : "text-amber-700"
                }
              >
                {r.status}
              </span>
            </div>
          ))}
          <p className="pt-2 text-slate-500">
            Configure integrations via environment variables. See `.env.example` and the README.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
