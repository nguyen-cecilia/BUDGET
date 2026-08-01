export type TransactionType = 'expense' | 'income';

export interface Transaction {
    id: string;
    user_id: string;
    type: TransactionType;
    amount: number;
    amount_currency_id: string;
    label: string;
    date: string;
    account_id: string;
    category_id: string | null;
    is_subscription: boolean;
    subscription_id?: string | null;
    tags?: {
        id: string;
        label: string;
    }[];
    created_at?: string;
    account: {
        id: string;
        label: string;
    };
    category: {
        id: string;
        label: string;
        color: string;
    } | null;
    currency: {
        id: string;
        code: string;
        label: string;
    };
}

export interface TransactionsByDay {
    date: string;
    transactions: Transaction[];
    total_amount: number;
    total_amount_currency: string;
}

export interface TransactionsByMonth {
    month: string;
    count: number;
    transactionsByDay: TransactionsByDay[];
}
