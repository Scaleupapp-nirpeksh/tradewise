export function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // In development, allow unauthenticated cron calls
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  return token === secret;
}
