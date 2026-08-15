export interface Subscription {
    id: string;
    label: string;
    next_payment_date: string;
    is_active: boolean;
    account_id: string | null;
    account: {
        label: string;
    };
    category_id: string | null;
    category: {
        label: string;
        color: string;
    };
    frequency: string;
    amount: number;
    currency_id: string;
    currency: {
        code: string;
        label: string;
        symbol: string;
    };
    created_at: string;
    user_id: string;
}
