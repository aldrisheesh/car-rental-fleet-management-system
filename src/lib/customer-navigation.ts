export function isMyBookingsPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return (
    normalizedPath === "/customer" ||
    normalizedPath === "/bookings" ||
    normalizedPath.startsWith("/bookings/")
  );
}
