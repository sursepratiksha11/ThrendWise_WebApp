import localStore from "../localStore.js";

const USE_LOCAL_STORAGE = !process.env.MONGODB_URI;

let FraudReport;

if (USE_LOCAL_STORAGE) {
  // Local storage adapter for testing
  FraudReport = {
    create: (data) => localStore.createFraudReport(data),
    find: () => Promise.resolve(localStore.findFraudReports()),
    findById: (id) => Promise.resolve(localStore.fraudReports.find((f) => f._id == id)),
    findByIdAndUpdate: (id, data) => {
      const report = localStore.fraudReports.find((f) => f._id == id);
      if (report) Object.assign(report, data, { updatedAt: new Date() });
      return Promise.resolve(report);
    },
    findByIdAndDelete: (id) => {
      const index = localStore.fraudReports.findIndex((f) => f._id == id);
      if (index > -1) return Promise.resolve(localStore.fraudReports.splice(index, 1)[0]);
      return Promise.resolve(null);
    },
  };
} else {
  // MongoDB version would go here when switching to MongoDB
  FraudReport = null; // Placeholder for MongoDB schema
}

export default FraudReport;
