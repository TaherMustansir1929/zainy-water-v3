import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleHalfDotIcon, CheckmarkCircle03Icon } from "@hugeicons/core-free-icons";
import type { BottleUsageDayRecord } from "@/types/moderator.types";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type BottleUsageTableProps = {
  availableBottles: number;
  usage: BottleUsageDayRecord | null;
  isLoading?: boolean;
};

export const BottleUsageTable = ({
  availableBottles,
  usage,
  isLoading = false,
}: BottleUsageTableProps) => {
  return (
    <section className="w-full rounded-3xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Bottle Usage Day Snapshot</h3>
        {isLoading ? <Spinner className="size-4" /> : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Available</TableHead>
            <TableHead>Filled</TableHead>
            <TableHead>Sale</TableHead>
            <TableHead>Empty</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Returned</TableHead>
            <TableHead>Caps</TableHead>
            <TableHead>Done</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{availableBottles}</TableCell>
            <TableCell>{usage ? usage.filled_bottles : "N/A"}</TableCell>
            <TableCell>{usage ? usage.sales : "N/A"}</TableCell>
            <TableCell>{usage ? usage.empty_bottles : "N/A"}</TableCell>
            <TableCell>{usage ? usage.remaining_bottles : "N/A"}</TableCell>
            <TableCell>{usage ? usage.returned_bottles : "N/A"}</TableCell>
            <TableCell>{usage ? usage.caps : "N/A"}</TableCell>
            <TableCell>{usage ? <HugeiconsIcon icon={usage.done ? CheckmarkCircle03Icon : CancelCircleHalfDotIcon} className={cn("size-5", usage.done? "text-emerald-500" : "text-destructive")} /> : "N/A"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
  );
};