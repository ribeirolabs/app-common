import superjson from "superjson";
import { prisma } from "@/server/db/client";
import { createSSGHelpers } from "@trpc/react/ssg";
import { appRouter } from "@/server/router";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { unstable_getServerSession } from "next-auth";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

type Props = Record<string, any>;

export const ssp = async (
  ctx: GetServerSidePropsContext,
  cb: (
    srr: ReturnType<typeof createSSGHelpers<typeof appRouter>>
  ) => Promise<any> | Promise<any>[]
): Promise<GetServerSidePropsResult<Props>> => {
  const session = await unstable_getServerSession(
    ctx.req,
    ctx.res,
    authOptions
  );

  const ssr = createSSGHelpers({
    router: appRouter,
    transformer: superjson,
    ctx: {
      // req: undefined,
      // res: undefined,
      session: session,
      prisma: prisma,
    },
  });

  await Promise.all([
    ssr.fetchQuery("auth.getSession"),
    ...([] as Promise<any>[]).concat(cb(ssr)),
  ]);

  return {
    props: {
      trpcState: ssr.dehydrate(),
    },
  };
};