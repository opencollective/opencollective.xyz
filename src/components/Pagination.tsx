import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export default function Pagination({
  txsPerPage,
  currentPage,
  totalPages,
  onPageChange,
  onTxsPerPageChange,
}: {
  txsPerPage: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onTxsPerPageChange: (txsPerPage: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col-reverse sm:flex-row justify-center items-center gap-2">
      {/* selector to change number of transactions per page */}
      <select
        className="border rounded-md"
        value={txsPerPage}
        onChange={(e) => onTxsPerPageChange(Number(e.target.value))}
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <div className="flex justify-center items-center gap-2">
        <Button
          disabled={currentPage === 1}
          variant="outline"
          onClick={() => onPageChange(1)}
        >
          First
        </Button>
        <Button
          disabled={currentPage === 1}
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentPage} of {totalPages}
        </span>
        <Button
          disabled={currentPage === totalPages}
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          disabled={currentPage === totalPages}
          variant="outline"
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </Button>
      </div>
    </div>
  );
}
