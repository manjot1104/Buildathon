import { redirect } from "next/navigation";

/** Client request status links reuse the approval token experience when applicable. */
export default function RequestTokenPage({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/approve/${params.token}`);
}
