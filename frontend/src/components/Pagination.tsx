type Props = {
  offset: number;
  limit: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
};

export function Pagination({ offset, limit, total, onNext, onPrev }: Props) {
  if (total === 0) return null;

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="pagination">
      <button onClick={onPrev} disabled={offset === 0}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages} ({total} total)
      </span>
      <button onClick={onNext} disabled={offset + limit >= total}>
        Next
      </button>
    </div>
  );
}
