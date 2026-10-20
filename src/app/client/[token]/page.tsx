import { redirect } from "next/navigation";

export default function ClientPortalPage({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/approve/${params.token}`);
}
