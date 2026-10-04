import { resolvedReturnLocation } from "./customer-handoff.ts";

export type BookingServiceDraft = {
  pickupDeliveryOption: "pickup" | "delivery";
  pickupLocation: string;
  dropoffLocation: string;
  sameReturnLocation: boolean;
};

export function bookingServiceFields(draft: BookingServiceDraft) {
  const delivery = draft.pickupDeliveryOption === "delivery";
  return {
    pickupDeliveryOption: draft.pickupDeliveryOption,
    pickupLocation: delivery ? draft.pickupLocation.trim() : null,
    dropoffLocation: delivery
      ? resolvedReturnLocation({
          deliveryAddress: draft.pickupLocation,
          alternateReturnAddress: draft.dropoffLocation,
          sameReturnLocation: draft.sameReturnLocation,
        })
      : null,
  };
}

export function bookingServiceErrors(draft: BookingServiceDraft) {
  const errors: { pickupLocation?: string; dropoffLocation?: string } = {};
  if (draft.pickupDeliveryOption === "delivery") {
    if (!draft.pickupLocation.trim())
      errors.pickupLocation = "Enter the delivery address.";
    if (!draft.sameReturnLocation && !draft.dropoffLocation.trim())
      errors.dropoffLocation = "Enter the collection address.";
  }
  return errors;
}
