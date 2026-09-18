import type { Vehicle as LegacyVehicle } from "@/data/vehicles";
import { Link } from "@tanstack/react-router";
import type { CustomerVehicle } from "@/lib/customer-data";
import { encodeSearch } from "@/lib/customer-data";
import {
  FinderReasons,
  Rate,
  VehicleFacts,
  VehicleImage,
} from "@/components/customer/CustomerPrimitives";

type VehicleCardProps = {
  vehicle?: CustomerVehicle;
  /** Kept for the older, out-of-slice customer landing route during migration. */
  v?: LegacyVehicle;
  href?: string;
  reason?: string;
  bookingSearch?: Record<string, string | undefined>;
  bookingLabel?: string;
  actionDisabled?: boolean;
  disabledActionLabel?: string;
  availabilityUnavailable?: boolean;
  tripMismatch?: boolean;
};

type CardVehicle = CustomerVehicle;

export function VehicleCard({
  vehicle,
  v,
  href,
  reason,
  bookingSearch,
  bookingLabel,
  actionDisabled = false,
  disabledActionLabel = "Unavailable for your dates",
  availabilityUnavailable = false,
  tripMismatch = false,
}: VehicleCardProps) {
  const currentVehicle = vehicle ?? legacyVehicle(v);
  if (!currentVehicle) return null;

  const destination =
    href ??
    `/booking${encodeSearch({
      vehicle: currentVehicle.id,
      ...bookingSearch,
    })}`;
  const imageStatus = availabilityUnavailable
    ? "Unavailable"
    : tripMismatch
      ? "Doesn't match trip"
      : null;

  return (
    <article
      className={`vehicle-card${availabilityUnavailable ? " vehicle-card--unavailable" : ""}${tripMismatch ? " vehicle-card--trip-mismatch" : ""}`}
    >
      <div className="vehicle-card-image">
        <VehicleImage
          src={currentVehicle.image_url}
          alt={currentVehicle.name}
          sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        {imageStatus ? (
          <span className="vehicle-card-image-status">{imageStatus}</span>
        ) : null}
      </div>
      <div className="vehicle-card-body">
        <div className="vehicle-card-heading">
          <div className="min-w-0">
            <p className="vehicle-card-category">
              {currentVehicle.category?.name || "Category not listed"}
            </p>
            <h3>{currentVehicle.name}</h3>
          </div>
          <Rate value={currentVehicle.daily_rate} />
        </div>

        {reason ? <FinderReasons reasons={[reason]} compact /> : null}

        <VehicleFacts vehicle={currentVehicle} className="vehicle-card-facts" />

        {actionDisabled ? (
          <button
            className="customer-primary-button vehicle-card-action"
            type="button"
            disabled
          >
            {disabledActionLabel}
          </button>
        ) : (
          <Link
            className="customer-primary-button vehicle-card-action"
            to={destination as never}
          >
            {bookingLabel ?? "View car"}
          </Link>
        )}
      </div>
    </article>
  );
}

function legacyVehicle(value: LegacyVehicle | undefined): CardVehicle | null {
  if (!value) return null;
  return {
    id: value.id,
    name: value.name,
    license_plate: null,
    transmission: value.transmission,
    fuel_type: value.fuel,
    seat_capacity: value.seats,
    daily_rate: value.pricePerDay,
    image_url: value.image,
    branch: { name: value.branch },
    category: { name: value.category },
  };
}
