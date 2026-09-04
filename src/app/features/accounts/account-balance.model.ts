export interface AccountBalance {
    id: string;
    user_id: string;
    account_id: string;
    year: number;
    month: number;
    balance: number;
    created_at: string;
}

export interface AccountBalanceWithAccount extends AccountBalance {
    account: {
        id: string;
        label: string;
        currency: {
            id: string;
            code: string;
            label: string;
            symbol: string;
        };
    };
}
