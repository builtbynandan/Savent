import { type Transaction } from '@savent/contracts';
import { type CSSProperties } from 'react';

type TransactionListProps = {
  transactions: Transaction[];
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

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">
          ↗
        </div>
        <h3>No transactions yet</h3>
        <p>Add your first income or expense using the form.</p>
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
                  <span className="muted">Uncategorised</span>
                )}
              </td>
              <td>{transaction.account.name}</td>
              <td>
                {dateFormatter.format(new Date(transaction.transactionDate))}
              </td>
              <td className={`amount-column amount-${transaction.type}`}>{`${
                transaction.type === 'income'
                  ? '+'
                  : transaction.type === 'expense'
                    ? '-'
                    : ''
              }${formatMoney(transaction)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
