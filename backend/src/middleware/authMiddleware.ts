import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { Env } from "../config/env";

type JwtPayload = {
  sub: string;
};

type Variables = {
  userId: string;
};

export const authMiddlware: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    c.status(403);
    return c.json({ message: "Forbidden: Missing or invalid authorization." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedPayload = (await verify(
      token,
      c.env.JWT_SECRET
    )) as JwtPayload;

    if (!decodedPayload.sub) {
      c.status(403);
      return c.json({ message: "Forbidden: Invalid token payload." });
    }

    c.set("userId", decodedPayload.sub);

    await next();
  } catch (error) {
    c.status(403);
    return c.json({
      message: "Forbidden: You are not authorized to access this resource.",
      error: (error as Error).message,
    });
  }
};
