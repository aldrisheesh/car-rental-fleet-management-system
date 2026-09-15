import type { Vehicle as LegacyVehicle } from "@/data/vehicles";
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
};

type CardVehicle = CustomerVehicle;

export function VehicleCard({
  vehicle,
  v,
  href,
  reason,
  bookingSearch,
  bookingLabel,
}: VehicleCardProps) {
  const currentVehicle = vehicle ?? legacyVehicle(v);
  if (!currentVehicle) return null;

  const destination =
    href ??
    `/booking${encodeSearch({
      vehicle: currentVehicle.id,
      ...bookingSearch,
    })}`;

  return (
    <article className="vehicle-card">
      <div className="vehicle-card-image">
        <VehicleImage
          src={currentVehicle.image_url}
          alt={currentVehicle.name}
          sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
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

        <a
          className="customer-primary-button vehicle-card-action"
          href={destination}
        >
          {bookingLabel ?? "View car"}
        </a>
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
