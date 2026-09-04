export interface Account {
    id: string;
    label: string;
    is_active: boolean;
    is_default: boolean;
    currency_id: string | null;
    created_at: string;
    user_id: string;
    currency?: {
        id: string;
        code: string;
        label: string;
        symbol: string;
    };
}
