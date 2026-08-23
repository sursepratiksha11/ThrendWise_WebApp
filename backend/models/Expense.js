import localStore from "../localStore.js";

const USE_LOCAL_STORAGE = !process.env.MONGODB_URI;

let Expense;

if (USE_LOCAL_STORAGE) {
  // Local storage adapter for testing
  Expense = {
    create: (data) => localStore.createExpense(data),
    find: (query) => Promise.resolve(localStore.findExpenses(query)),
    findById: (id) => Promise.resolve(localStore.expenses.find((e) => e._id == id)),
    findByIdAndUpdate: (id, data) => {
      const expense = localStore.expenses.find((e) => e._id == id);
      if (expense) Object.assign(expense, data, { updatedAt: new Date() });
      return Promise.resolve(expense);
    },
    findByIdAndDelete: (id) => {
      const index = localStore.expenses.findIndex((e) => e._id == id);
      if (index > -1) return Promise.resolve(localStore.expenses.splice(index, 1)[0]);
      return Promise.resolve(null);
    },
  };
} else {
  // MongoDB version would go here when switching to MongoDB
  Expense = null; // Placeholder for MongoDB schema
}

export default Expense;
