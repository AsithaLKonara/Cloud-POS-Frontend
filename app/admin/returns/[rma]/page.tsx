import PageClient from "./PageClient";

export default function Page({ params }: { params: Promise<{ rma: string }> }) {
  return <PageClient params={params} />;
}
