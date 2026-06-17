"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  label: string
  onPageChange: (page: number) => void
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  label,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return
    }

    onPageChange(page)
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <span className="text-sm text-gray-500">
        {label} : {totalItems} patients
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
          className="
            w-9 h-9
            border
            border-gray-200
            rounded-lg
            text-gray-500
            flex
            items-center
            justify-center
            disabled:text-gray-300
            disabled:cursor-not-allowed
            hover:border-green-600
            hover:text-green-600
            disabled:hover:border-gray-200
          "
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1

          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              className={`
                w-9 h-9
                rounded-lg
                border
                font-semibold
                transition-colors
                ${
                  currentPage === page
                    ? "border-green-600 text-green-600"
                    : "border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-600"
                }
              `}
            >
              {page}
            </button>
          )
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
          className="
            w-9 h-9
            border
            border-gray-200
            rounded-lg
            text-gray-500
            flex
            items-center
            justify-center
            disabled:text-gray-300
            disabled:cursor-not-allowed
            hover:border-green-600
            hover:text-green-600
            disabled:hover:border-gray-200
          "
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
