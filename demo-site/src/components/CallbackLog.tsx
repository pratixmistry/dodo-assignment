import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id: string;
  kind: "success" | "error" | "close";
  label: string;
  detail: string;
  time: string;
}

const badgeVariant: Record<LogEntry["kind"], "default" | "destructive" | "secondary"> = {
  success: "default",
  error: "destructive",
  close: "secondary",
};

export default function CallbackLog({ entries }: { entries: LogEntry[] }) {
  return (
    <Card className="dark bg-card text-card-foreground gap-0 py-0">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm">Callback log</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[520px]">
          <div className="flex flex-col gap-2 p-3">
            {entries.length === 0 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Buy something to see callbacks fire here.
              </div>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "rounded-lg border-l-2 bg-white/5 px-3 py-2",
                  entry.kind === "success" && "border-l-primary",
                  entry.kind === "error" && "border-l-destructive",
                  entry.kind === "close" && "border-l-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={badgeVariant[entry.kind]} className="rounded-sm">
                    {entry.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{entry.time}</span>
                </div>
                <div className="mt-1 font-mono text-[11px] break-words text-muted-foreground">{entry.detail}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
