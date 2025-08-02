import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../config/env";
import { authMiddleware } from "../middleware/authMiddleware";
import { getBalance, transfer } from "../controllers/accountController";
import { transferSchema } from "../validators/accountValidator";

const accountRouter = new Hono<{
  Bindings: Env;
  Variables: { userId: string };
}>();

accountRouter.use("*", authMiddleware);

// GET /api/v1/account/balance
accountRouter.get("/balance", getBalance);

// POST /api/v1/account/transfer
accountRouter.post(
  "/transfer",
  zValidator("json", transferSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { message: "Invalid transfer request", errors: result.error.issues },
        400
      );
    }
  }),
  transfer
);

export default accountRouter;
