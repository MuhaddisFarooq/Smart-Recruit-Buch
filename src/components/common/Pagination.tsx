import React from "react";
import {
  Pagination as UiPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <UiPagination>
      <PaginationContent>
        {prevPage && (
          <>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(prevPage)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(prevPage)}>
                {prevPage}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem>
          <PaginationLink isActive>{currentPage}</PaginationLink>
        </PaginationItem>
        {nextPage && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(nextPage)}>
                {nextPage}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(nextPage)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </>
        )}
      </PaginationContent>
    </UiPagination>
  );
};

export default Pagination;
