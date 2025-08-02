import { Context } from "hono";
import { sign } from "hono/jwt";
import * as argon2 from "argon2";
import z from "zod";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../services/db";
import { Env } from "../config/env";
import {
  signupSchema,
  signinSchema,
  updateSchema,
} from "../validators/userValidator";

type SignupBody = z.infer<typeof signupSchema>;
type SigninBody = z.infer<typeof signinSchema>;
type UpdateBody = z.infer<typeof updateSchema>;

export const signup = async (c: Context<{ Bindings: Env }>) => {
  try {
    // const body = await c.req.json<SignupBody>();
    const body: SigninBody = c.get("json");

    const { db } = await connectToDatabase(c.env);
    const usersCollection = db.collection("users");
    const accountCollection = db.collection("accounts");

    const existingUser = await usersCollection.findOne({ email: body.email });
    if (existingUser) {
      c.status(409); // Conflict
      return c.json({ message: "User with this email already exists." });
    }

    const hashedPassword = await argon2.hash(body.password);

    const newUser = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password_hash: hashedPassword,
    };
    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId;

    await accountCollection.insertOne({
      userId: userId,
      balance: Number((1 + Math.random() * 10000).toFixed(2)),
    });

    const payload = {
      sub: userId.toHexString(), // subject
      iat: Math.floor(Date.now() / 1000), // issued at
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expires in 24 hr
    };
    const token = await sign(payload, c.env.JWT_SECRET);

    c.status(201); // Created
    return c.json({
      message: "User created successfully.",
      token: token,
    });
  } catch (error) {
    console.error("Signup Error: ", error);
    c.status(500);
    return c.json({
      message: "An internal server error occurred during signup.",
    });
  }
};

export const signin = async (c: Context<{ Bindings: Env }>) => {
  try {
    // const body = await c.req.json<SigninBody>();
    const body: SigninBody = c.get("json");

    const { db } = await connectToDatabase(c.env);
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email: body.email });
    if (!existingUser) {
      c.status(404); // Not found
      return c.json({
        message: "User not found. Please check email or sign up.",
      });
    }

    const isPasswordValid = await argon2.verify(
      existingUser.password_hash,
      body.password
    );
    if (!isPasswordValid) {
      c.status(401); // Unauthorized
      return c.json({ message: "Incorrect password." });
    }

    const payload = {
      sub: existingUser._id.toHexString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };
    const token = await sign(payload, c.env.JWT_SECRET);

    c.status(200);
    return c.json({
      message: "User signed in successfull.",
      name: existingUser.firstName,
      token: token,
    });
  } catch (error) {
    console.error("Signin Error: ", error);
    c.status(500);
    return c.json({
      mesage: "An internal server error occurred during signin.",
    });
  }
};

export const updateUser = async (
  c: Context<{ Bindings: Env; Variables: { userId: string } }>
) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json<UpdateBody>();

    if (Object.keys(body).length === 0) {
      c.status(400);
      return c.json({ message: "Request body cannot be empty." });
    }

    const { db } = await connectToDatabase(c.env);
    const usersCollection = db.collection("users");

    const updateData: { [key: string]: any } = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;

    if (body.password) {
      updateData.password_hash = await argon2.hash(body.password);
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    return c.json({ message: "Updated successfully." });
  } catch (error) {
    console.error("Update User Error: ", error);
    c.status(500);
    return c.json({
      mesage: "An internal server error occurred during signin.",
    });
  }
};

export const bulkSearch = async (
  c: Context<{ Bindings: Env; Variables: { userId: string } }>
) => {
  try {
    const userId = c.get("userId");
    const filter = c.req.query("filter") || "";

    const { db } = await connectToDatabase(c.env);
    const usersCollection = db.collection("users");

    const query = {
      $or: [
        { firstName: { $regex: filter, $options: "i" } },
        { lastName: { $regex: filter, $options: "i" } },
      ],
      _id: { $ne: new ObjectId(userId) },
    };

    const users = await usersCollection
      .find(query, {
        projection: {
          firstName: 1,
          lastName: 1,
          _id: 1,
        },
      })
      .toArray();

    return c.json({
      user: users.map((user) => ({
        firstName: user.firstName,
        lastName: user.lastName,
        _id: user._id,
      })),
    });
  } catch (error) {
    console.error("Bulk Search Error: ", error);
    c.status(500);
    return c.json({
      message: "An internal server error occurred during search.",
    });
  }
};
