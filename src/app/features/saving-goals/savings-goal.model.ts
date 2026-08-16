export interface SavingsGoal {
    id: string;
    label: string;
    target_amount: number;
    current_amount: number;
    amount_per_month: number;
    currency_id: string;
    currency: {
        label: string;
        code: string;
        symbol: string;
    };
    created_at: string;
    user_id: string;
}
