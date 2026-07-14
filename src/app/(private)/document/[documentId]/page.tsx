import {DocumentEditor} from "./DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return <DocumentEditor />;
}
