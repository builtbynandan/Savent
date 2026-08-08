import { type Transaction } from '@savent/contracts';
import { type CSSProperties } from 'react';

type TransactionListProps = {
  transactions: Transaction[];
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
};

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatMoney(transaction: Transaction) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: transaction.currency,
  }).format(Number(transaction.amount));
}

export function TransactionList({
  transactions,
  onDelete,
  onEdit,
  onView,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">
          ⌕
        </div>
        <h3>No matching transactions</h3>
        <p>Try clearing a filter or add a new transaction.</p>
      </div>
    );
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th scope="col">Transaction</th>
            <th scope="col">Category</th>
            <th scope="col">Account</th>
            <th scope="col">Date</th>
            <th className="amount-column" scope="col">
              Amount
            </th>
            <th className="actions-column" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <div className={`transaction-mark ${transaction.type}`}>
                  {transaction.type === 'income'
                    ? '↙'
                    : transaction.type === 'expense'
                      ? '↗'
                      : '↔'}
                </div>
                <div>
                  <strong>{transaction.description}</strong>
                  <small className="mobile-meta">
                    {transaction.account.name} ·{' '}
                    {dateFormatter.format(
                      new Date(transaction.transactionDate),
                    )}
                  </small>
                </div>
              </td>
              <td>
                {transaction.category ? (
                  <span
                    className="category-pill"
                    style={
                      {
                        '--category-color':
                          transaction.category.color ?? '#64748b',
                      } as CSSProperties
                    }
                  >
                    {transaction.category.name}
                  </span>
                ) : (
                  <span className="muted">
                    {transaction.type === 'transfer'
                      ? 'Transfer'
                      : 'Uncategorised'}
                  </span>
                )}
              </td>
              <td>
                {transaction.account.name}
                {transaction.destinationAccount
                  ? ` → ${transaction.destinationAccount.name}`
                  : ''}
              </td>
              <td>
                {dateFormatter.format(new Date(transaction.transactionDate))}
              </td>
              <td
                className={`amount-column amount-${transaction.type}`}
              >{`${transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}${formatMoney(transaction)}`}</td>
              <td className="actions-column">
                <div className="row-actions">
                  <button
                    aria-label={`View ${transaction.description}`}
                    onClick={() => onView(transaction)}
                    type="button"
                  >
                    View
                  </button>
                  <button
                    aria-label={`Edit ${transaction.description}`}
                    onClick={() => onEdit(transaction)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="danger-link"
                    aria-label={`Delete ${transaction.description}`}
                    onClick={() => onDelete(transaction)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
