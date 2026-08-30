-- Deterministic development reference data; not verified operational records.
insert into public.vehicles
  (name, category_id, branch_id, license_plate, transmission, fuel_type, seat_capacity, daily_rate, is_active)
select v.name, c.id, b.id, v.license_plate, v.transmission, v.fuel_type, v.seat_capacity, v.daily_rate, true
from (values
  ('Toyota Wigo', 'Economy', 'Taft, Manila', 'DEV-WIGO-001', 'Manual', 'Gasoline', 5, 1000::numeric),
  ('Mitsubishi Mirage', 'Economy', 'Taft, Manila', 'DEV-MIRA-001', 'Automatic', 'Gasoline', 5, 1200::numeric),
  ('Toyota Vios', 'Sedan', 'Antipolo, Rizal', 'DEV-VIOS-001', 'Automatic', 'Gasoline', 5, 1800::numeric),
  ('Honda City', 'Sedan', 'Taft, Manila', 'DEV-CITY-001', 'Automatic', 'Gasoline', 5, 2000::numeric),
  ('Toyota Rush', 'SUV', 'Antipolo, Rizal', 'DEV-RUSH-001', 'Automatic', 'Gasoline', 7, 2500::numeric),
  ('Ford Everest', 'SUV', 'Taft, Manila', 'DEV-EVST-001', 'Automatic', 'Diesel', 7, 3200::numeric),
  ('Toyota Avanza', 'MPV', 'Antipolo, Rizal', 'DEV-AVAN-001', 'Automatic', 'Gasoline', 7, 2200::numeric),
  ('Toyota Innova', 'MPV', 'Taft, Manila', 'DEV-INNO-001', 'Automatic', 'Diesel', 8, 2800::numeric),
  ('Nissan Urvan', 'Van', 'Antipolo, Rizal', 'DEV-URVN-001', 'Manual', 'Diesel', 15, 3500::numeric),
  ('Toyota Hiace', 'Van', 'Taft, Manila', 'DEV-HIAC-001', 'Manual', 'Diesel', 15, 4200::numeric),
  ('Ford Ranger', 'Pickup', 'Antipolo, Rizal', 'DEV-RANG-001', 'Automatic', 'Diesel', 5, 3000::numeric),
  ('Toyota Hilux', 'Pickup', 'Taft, Manila', 'DEV-HILX-001', 'Automatic', 'Diesel', 5, 3300::numeric)
) as v(name, category_name, branch_name, license_plate, transmission, fuel_type, seat_capacity, daily_rate)
join public.vehicle_categories c on c.name = v.category_name
join public.branches b on b.name = v.branch_name
where not exists (select 1 from public.vehicles existing where existing.license_plate = v.license_plate);
