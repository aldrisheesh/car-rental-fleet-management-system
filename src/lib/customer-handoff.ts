export function resolvedReturnLocation({
  deliveryAddress,
  alternateReturnAddress,
  sameReturnLocation,
}: {
  deliveryAddress: string;
  alternateReturnAddress: string;
  sameReturnLocation: boolean;
}) {
  return sameReturnLocation
    ? deliveryAddress.trim()
    : alternateReturnAddress.trim();
}
