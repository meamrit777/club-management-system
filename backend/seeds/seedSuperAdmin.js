import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/UserModel.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const superAdminExists = await User.findOne({
      role: "SuperAdmin",
    });

    if (superAdminExists) {
      console.log("SuperAdmin already exists");
      process.exit();
    }

    await User.create({
      name: "Super Admin",
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.DEFAULT_SUPER_ADMIN_PASSWORD,
      phoneNumber: process.env.SUPER_ADMIN_PHONE,
      role: "SuperAdmin",
    });

    console.log("SuperAdmin created successfully");

    process.exit();
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
};

seedSuperAdmin();
