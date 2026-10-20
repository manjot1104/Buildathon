import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Help"
        description="Get started with ScopePilot and learn where to go next."
      />
      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <div>
            <h2 className="font-semibold">Workflow</h2>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
              <li>Create a project and define the original scope.</li>
              <li>Log client requests and run scope analysis.</li>
              <li>Draft a change proposal with line items and send for approval.</li>
              <li>Share the approval link with your client if email is not connected.</li>
            </ol>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/how-it-works">How it works</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">Contact support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
