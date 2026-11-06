import { JobBoard } from "@/components/hr/JobBoard";

export default async function JobPage(props: PageProps<"/hr/vakansiyalar/[id]">) {
  const { id } = await props.params;
  return <JobBoard jobId={id} query={await props.searchParams} base="/hr/vakansiyalar" />;
}
