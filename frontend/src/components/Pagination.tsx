interface PaginationProps {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pageCount, onPage }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <div className="pagination">
      <button type="button" className="btn btn-secondary" disabled={page === 1} onClick={() => onPage(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {pageCount}
      </span>
      <button type="button" className="btn btn-secondary" disabled={page === pageCount} onClick={() => onPage(page + 1)}>
        Siguiente
      </button>
    </div>
  );
}
