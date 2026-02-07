import { TransactionHistory } from '../../components/TransactionHistory';

export const TransactionsPage = () => {
    return (
        <div className="h-full p-6 flex flex-col pointer-events-auto">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Sales History</h1>
            <div className="flex-1 min-h-0">
                <TransactionHistory />
            </div>
        </div>
    );
};
