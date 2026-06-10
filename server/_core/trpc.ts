import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// ─── PANITIA AUTH (token via header x-panitia-token) ────────────
// Dipakai endpoint Boss Panel / SuperAdmin. Token didapat dari
// verifyPanitiaPassword. Lihat server/panitiaAuth.ts.
import { verifyToken } from "../panitiaAuth";

const requirePanitiaToken = t.middleware(async opts => {
  const { ctx, next } = opts;
  const raw = ctx.req.headers["x-panitia-token"];
  const token = Array.isArray(raw) ? raw[0] : raw;
  const role = await verifyToken(token);
  if (!role) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sesi panitia tidak valid atau sudah kedaluwarsa. Silakan login ulang.",
    });
  }
  return next({ ctx: { ...ctx, panitiaRole: role } });
});

export const panitiaProcedure = t.procedure.use(requirePanitiaToken);
