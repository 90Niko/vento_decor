"use client";

import { useState } from "react";
import { AdminEventsPanel } from "./admin-events-panel";
import { AllEventsPanel } from "./all-events-panel";

export function AdminEventsDashboard() {
  const [refreshVersion, setRefreshVersion] = useState(0);

  return (
    <div className="space-y-12">
      <AdminEventsPanel
        onCreated={() => setRefreshVersion((version) => version + 1)}
      />
      <AllEventsPanel refreshVersion={refreshVersion} />
    </div>
  );
}
