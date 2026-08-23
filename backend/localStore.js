// Local in-memory storage for testing (before switching to MongoDB)
const store = {
  stocks: [
    { _id: 1, stockName: "AAPL", price: 185.50, date: new Date(Date.now() - 86400000), createdAt: new Date() },
    { _id: 2, stockName: "AAPL", price: 186.20, date: new Date(Date.now() - 172800000), createdAt: new Date() },
    { _id: 3, stockName: "AAPL", price: 184.75, date: new Date(Date.now() - 259200000), createdAt: new Date() },
    { _id: 4, stockName: "MSFT", price: 420.30, date: new Date(Date.now() - 86400000), createdAt: new Date() },
    { _id: 5, stockName: "MSFT", price: 418.90, date: new Date(Date.now() - 172800000), createdAt: new Date() },
  ],
  expenses: [
    { _id: 1, description: "Grocery shopping", amount: 125.50, category: "Food", date: new Date(Date.now() - 86400000), createdAt: new Date() },
    { _id: 2, description: "Taxi ride", amount: 25.00, category: "Transport", date: new Date(Date.now() - 172800000), createdAt: new Date() },
    { _id: 3, description: "Movie ticket", amount: 15.00, category: "Entertainment", date: new Date(Date.now() - 259200000), createdAt: new Date() },
    { _id: 4, description: "Electricity bill", amount: 85.00, category: "Utilities", date: new Date(Date.now() - 345600000), createdAt: new Date() },
  ],
  fraudReports: [
    { _id: 1, description: "Unusual purchase at 3am", amount: 500, risk_score: 0.85, date: new Date(Date.now() - 86400000), createdAt: new Date() },
    { _id: 2, description: "Multiple failed login attempts", amount: 0, risk_score: 0.72, date: new Date(Date.now() - 172800000), createdAt: new Date() },
  ],
};

let nextId = {
  stocks: 6,
  expenses: 5,
  fraudReports: 3,
};

export const localStore = {
  // Stock operations
  createStock: (data) => {
    const stock = { _id: nextId.stocks++, ...data, createdAt: new Date() };
    store.stocks.push(stock);
    return stock;
  },

  findStocks: (query = {}) => {
    return store.stocks.filter((stock) => {
      if (query.stockName && !stock.stockName.includes(query.stockName))
        return false;
      if (query.date) {
        const queryDate = new Date(query.date);
        const stockDate = new Date(stock.date);
        if (stockDate.toDateString() !== queryDate.toDateString()) return false;
      }
      return true;
    });
  },

  findStockById: (id) => {
    return store.stocks.find((s) => s._id == id);
  },

  updateStock: (id, data) => {
    const stock = store.stocks.find((s) => s._id == id);
    if (stock) Object.assign(stock, data, { updatedAt: new Date() });
    return stock;
  },

  deleteStock: (id) => {
    const index = store.stocks.findIndex((s) => s._id == id);
    if (index > -1) return store.stocks.splice(index, 1)[0];
    return null;
  },

  // Expense operations
  createExpense: (data) => {
    const expense = { _id: nextId.expenses++, ...data, createdAt: new Date() };
    store.expenses.push(expense);
    return expense;
  },

  findExpenses: (query = {}) => {
    return store.expenses.filter((exp) => {
      if (query.category && exp.category !== query.category) return false;
      return true;
    });
  },

  // Fraud operations
  createFraudReport: (data) => {
    const report = { _id: nextId.fraudReports++, ...data, createdAt: new Date() };
    store.fraudReports.push(report);
    return report;
  },

  findFraudReports: () => store.fraudReports,

  // Utility
  clear: () => {
    store.stocks = [];
    store.expenses = [];
    store.fraudReports = [];
  },
};

export default localStore;
