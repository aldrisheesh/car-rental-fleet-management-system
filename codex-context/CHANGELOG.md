# Changelog

## 2026-09-02 — MIC-025 geocoding provider reassessment

- Compared TomTom, Geoapify, and LocationIQ using identical Philippine destinations.
- Found TomTom produced multiple false-positive destinations.
- Selected Geoapify as primary geocoder for stronger semantic accuracy.
- Selected LocationIQ as fallback for broader coverage and zero observed false positives.
- Removed TomTom/HERE from the active geocoding pair only.
- Preserved TomTom/HERE routing and traffic architecture.
- Preserved Open-Meteo/OpenWeather weather architecture.
- Required provider-neutral semantic quality checks before accepting geocodes.
- Required final manuscript provider-table revision through MIC-025.
