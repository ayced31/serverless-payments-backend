import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../config/env";
import {
  signup,
  signin,
  updateUser,
  bulkSearch,
} from "../controllers/userController";
import {
  signupSchema,
  signinSchema,
  updateSchema,
} from "../validators/userValidator";
import { authMiddleware } from "../middleware/authMiddleware";

const userRouter = new Hono<{ Binding: Env; Variables: { userId: string } }>();

// POST /api/v1/user/signup
userRouter.post(
  "/signup",
  zValidator("json", signinSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { message: "Incorrect inputs", errors: result.error.issues },
        400
      );
    }
  }),
  signup
);

// POST /api/v1/user/signin
userRouter.post(
  "/signin",
  zValidator("json", signinSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { message: "Incorrect inputs", errors: result.error.issues },
        400
      );
    }
  }),
  signin
);

// PUT /api/v1/user/
userRouter.put(
  "/",
  authMiddleware,
  zValidator("json", updateSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Error while updating information",
          errors: result.error.issues,
        },
        400
      );
    }
  }),
  updateUser
);

// GET /api/v1/user/bulk
userRouter.get("/bulk", authMiddleware, bulkSearch);

export default userRouter;
