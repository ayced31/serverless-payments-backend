import { Context } from "hono";
import { ObjectId } from "mongodb";
import z from "zod";
import { connectToDatabase } from "../services/db";
import { Env } from "../config/env";
import { transferSchema } from "../validators/accountValidator";

type TransferBody = z.infer<typeof transferSchema>;

export const getBalance = async (
  c: Context<{ Bindings: Env; Variables: { userId: string } }>
) => {
  try {
    const userId = c.get("userId");

    const { db } = await connectToDatabase(c.env);
    const accountsCollection = db.collection("accounts");

    const account = await accountsCollection.findOne({
      userId: new ObjectId(userId),
    });

    if (!account) {
      c.status(404);
      return c.json({ message: "Account not found." });
    }

    return c.json({ balance: account.balance });
  } catch (error) {
    console.error("Get Balance Error: ", error);
    c.status(500);
    return c.json({
      message: "An internal server error occurred while fetching the balance.",
    });
  }
};

export const transfer = async (
  c: Context<{ Bindings: Env; Variables: { userId: string } }>
) => {
  const { client, db } = await connectToDatabase(c.env);

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const body: TransferBody = c.get("json");
      const fromUserId = c.get("userId");
      const accountsCollection = db.collection("accounts");

      const fromAccount = await accountsCollection.findOne(
        { userId: new ObjectId(fromUserId) },
        { session }
      );

      if (!fromAccount || fromAccount.balance < body.amount) {
        throw new Error("Insufficient balance or sender account not found.");
      }

      const toAccount = await accountsCollection.findOne(
        { userId: new ObjectId(body.to) },
        { session }
      );

      if (!toAccount) {
        throw new Error("Recipent Account not found.");
      }

      await accountsCollection.updateOne(
        { userId: new ObjectId(fromUserId) },
        { $inc: { balance: -body.amount } },
        { session }
      );

      await accountsCollection.updateOne(
        { userId: new ObjectId(body.to) },
        { $inc: { balance: body.amount } },
        { session }
      );

      return c.json({ message: "Transaction Successful." });
    });
  } catch (error) {
    console.error("Transaction Error: ", error);
    c.status(400); // Bad Request
    return c.json({
      message: (error as Error).message || "Error processing transaction.",
    });
  } finally {
    await session.endSession();
  }
};
