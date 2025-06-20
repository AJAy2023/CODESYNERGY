const  mongoose = require("mongoose");
const Problem = require("../models/problems");
const problems = require("../data/problems.json");
const connectDB = require("../config/db");
const seedProblems = async () => {
  try {
    await connectDB();
    await Problem.deleteMany({});
    const createdProblems = await Problem.insertMany(problems);
    console.log(`${createdProblems.length} problems seeded successfully!`);
    process.exit();
  } catch (error) {
    console.error("Error seeding problems:", error);
    process.exit(1);
  }
};
seedProblems()
  .then(() => console.log("Seeding completed successfully."))
  .catch((error) => console.error("Error during seeding:", error))
  .finally(() => mongoose.connection.close());