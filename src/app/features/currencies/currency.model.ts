export interface Currency {
    id: string;
    code: string;
    label: string;
    symbol: string;
}

export interface UserCurrencies {
    currency_id: string;
    user_id: string;
    is_default: boolean;
    code: string;
    label: string;
    symbol: string;
}
