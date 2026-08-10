import {Injectable} from '@angular/core';
import {Transaction} from '../../features/transactions/transaction.model';
import {Account} from '../../features/accounts/account.model';
import {ModalController} from './modal.controller';
import {Tag} from '../../features/tags/tag.model';
import {Category} from '../../features/categories/category.model';
import {UserCurrencies} from "../../features/currencies/currency.model";

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    readonly transaction = new ModalController<Transaction>();
    readonly account = new ModalController<Account>();
    readonly tag = new ModalController<Tag>();
    readonly category = new ModalController<Category>();
    readonly currency = new ModalController<UserCurrencies>();
}
