const mongoose = require("mongoose");
const Problem = require("../models/problems");
const problems = require("../data/problems.json");
const connectDB = require("../config/db");

const seedProblems = async () => {
  try {
    await connectDB();

    await Problem.deleteMany({});

    //  Mark first 5 as free before inserting
    problems.forEach((problem, index) => {
      problem.isFree = index < 5; 
    });

    //   clear old data if you want clean DB
    // await Problem.deleteMany({});

    const createdProblems = await Problem.insertMany(problems);
    console.log(`${createdProblems.length} problems seeded successfully!`);

  } catch (error) {
    console.error(" Error seeding problems:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(); 
  }
};

seedProblems();
