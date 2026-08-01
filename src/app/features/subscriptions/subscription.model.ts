export interface Subscription {
    id: string;
    label: string;
    next_payment_date: string;
    is_active: boolean;
    account_id: string;
    category_id: string | null;
    frequency: string;
    created_at: string;
    user_id: string;
}
