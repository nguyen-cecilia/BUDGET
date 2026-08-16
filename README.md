# 💸 Budget

This project is made with **Angular** (version 21.0.4).

## Development

To start a local development server, run:

```bash
npm run start
```

To build the project, run:

```bash
npm run build
```

To lint the project, run :

```bash
npm run lint
```

## Planning

### V1

[Wireframe 1](https://id-preview-4a937b51--3100ca05-ec40-4340-b75f-a960c655361f.lovable.app/)
[Wireframe 2](https://id-preview--3100ca05-ec40-4340-b75f-a960c655361f.lovable.app/)

Layout:

- [x] Responsive
- [x] Desktop: sidebar with menu / Mobile: floating menu bar bottom
- [ ] Dark mode
- [x] Logo
- [ ] Better manage the loading states

Auth:

- [x] Simple lock with a password

Dashboard:

- [x] Last 10 transactions of the current month
- [x] Balance left
- [x] Stats: number of transactions, total amount spent, total amount earned, subscriptions (number and amount)
- [ ] View of the 7 next days
- [x] Transactions by category: cards, pie chart
- [ ] Savings goals
- [ ] Based on month earnings, do the 50/30/20 rule
- [ ] View per month: be able to choose the month (independent of the current month)

Transactions:

- [x] Search bar with filters by category and tag
- [x] List of transactions grouped by day, one page per month
- [x] CRUD modal: add, edit, delete
- [ ] Add multiple transactions at once

Transaction CRUD modal:

- [x] Expense / income selector
- [x] Amount input
- [x] Description input
- [x] Which account
- [x] Category selector
- [x] Date picker
- [x] Tag selector
- [x] Subscription

Savings goals:

- [x] List of goals (cards)
- [x] CRUD modal: add, edit, delete

Yearly view:

- [x] Stats: amount spent, amount earned, real amount of money earned (after all the transactions)
- [x] Charts
- [x] Detail month by month (cards, table)

Parameters:

- [x] Manage bank accounts
- [x] Manage categories
- [x] Manage tags
- [x] Manage currencies
- [x] Manage subscriptions
- [ ] Manage imports / exports
- [ ] Add types of categories: needs or wants
