import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./config/env";
import userRouter from "./routes/user.routes";
import accountRouter from "./routes/account.routes";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "https://payments-app-gray.vercel.app"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

const api = new Hono();

api.route("/user", userRouter);
api.route("/account", accountRouter);

app.route("/api/v1/", api);

export default app;
