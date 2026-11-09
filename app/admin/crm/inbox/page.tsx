import { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "WhatsApp CRM Inbox & Omnichannel Sales | XONIT Cloud",
  description: "Conversational commerce, live customer chat, and automated CRM dossier powered by Meta WhatsApp Cloud API.",
};

export default function CrmInboxPage() {
  return <PageClient />;
}

