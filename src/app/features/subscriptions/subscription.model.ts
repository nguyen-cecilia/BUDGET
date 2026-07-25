export interface Subscription {
    id: number;
    label: string;
    next_payment_date: string;
    is_active: boolean;
    account_id: string;
    category_id: string;
    frequency: string;
    created_at: string;
    user_id: string;
}
