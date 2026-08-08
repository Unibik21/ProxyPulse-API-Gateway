import { HttpMethod } from "@/lib/types";

const STYLES: Record<HttpMethod, string> = {
  GET: "text-wire border-wire/30 bg-wire/10",
  POST: "text-signal border-signal/30 bg-signal/10",
  PUT: "text-route border-route/30 bg-route/10",
  PATCH: "text-plum border-plum/30 bg-plum/10",
  DELETE: "text-danger border-danger/30 bg-danger/10",
};

export default function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${STYLES[method]}`}
    >
      {method}
    </span>
  );
}
