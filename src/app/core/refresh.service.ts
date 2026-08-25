import {Injectable, signal} from '@angular/core';

export type RefreshKey =
    | 'transaction'
    | 'tag'
    | 'category'
    | 'account'
    | 'currency'
    | 'subscription'
    | 'goal';

@Injectable({providedIn: 'root'})
export class RefreshService {
    trigger = signal(0);
    lastKey = signal<RefreshKey | null>(null);

    refresh(key: RefreshKey): void {
        this.lastKey.set(key);
        this.trigger.update(v => v + 1);
    }
}
