import PageClient from "./PageClient";

export const metadata = {
  title: "Service Job Sheet & RMA Dossier | XONIT ERP",
  description: "Technician diagnostic job sheet, parts tracking, and warranty claim status transitions",
};

export default async function WarrantyClaimDetailsPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  const resolvedParams = await params;
  return <PageClient claimId={resolvedParams.claimId} />;
}
