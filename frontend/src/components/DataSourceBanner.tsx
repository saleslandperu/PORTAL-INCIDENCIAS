import { useIncidentFeed } from "../hooks/useIncidentFeed";

export function DataSourceBanner() {
  const feed = useIncidentFeed();
  return <p className="notice">{feed.note}</p>;
}
