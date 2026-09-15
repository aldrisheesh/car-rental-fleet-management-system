export function isMyBookingsPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return (
    normalizedPath === "/customer" ||
    normalizedPath.startsWith("/customer/") ||
    normalizedPath === "/bookings" ||
    normalizedPath.startsWith("/bookings/")
  );
}
