import { timeAgo, fullDate } from "@/lib/utils";

export function TimeAgo({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={fullDate(iso)}>
      {timeAgo(iso)}
    </time>
  );
}
