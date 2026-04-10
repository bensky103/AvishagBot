"use client";

import { use } from "react";
import { IssueDetail } from "@/components/issues/IssueDetail";

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <IssueDetail issueId={Number(id)} />;
}
