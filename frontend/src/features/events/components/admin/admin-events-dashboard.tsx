import { AllEventsPanel } from "./all-events-panel";

export function AdminEventsDashboard({ basePath = "/admin/events" }: { basePath?: string }) {
  return (
    <AllEventsPanel refreshVersion={0} basePath={basePath} />
  );
}
