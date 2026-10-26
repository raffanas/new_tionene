# Authoritative final hotel-name / zone import — v0.1.38

`Ultimate_Tio_Nene_Hotels_Two_Columns.xlsx` — original owner-confirmed latest workbook; **preserved byte-for-byte**. Worksheet `Final Hotel Database` has **1,125 records**, columns exactly `Hotel Name`, `Location` with 8 known categories: `Puerto Juarez`, `Isla Blanca`, `Cancun Center`, `Cancun Hotel Zone`, `Maya Riviera`, `Playa del Carmen`, `Tulum Center`, `Tulum Hotel Zone`.

- Current structural checks: no blanks, no identical names, no unexpected zones (and no detected case/accent/punctuation-normalized duplicate names in this version). **Geo classifications were curated earlier by owner, not independently proven in this ZIP test**.
- Use one canonical hotel per physical property, preserve stable internal ID and original display name, add aliases only via validated Admin editing; **do not automatically merge different buildings based on similar resort names**.
- Hotel selected for a booking is the **dated hotel stay valid for that service date**; users can have multiple hotels. Free-typed unknown hotels must remain possible, and missing-zone booking pricing must not invent a location or supplier tariff; per-reservation editable cost/manual quote retained.
- Import **this file only**, not older 1,201-hotel versions or `Shared Reference` as if it were a hotel directory. `Shared Reference` contains separate **provider zone-pricing rules**.
- Provider Xcaret/Miguel/Playa Mía rate eligibility uses canonical zone as a selector only as per approved maps; provider departure/tariff zone is not automatically identical to the canonical hotel zone. `PLY-R003` Cozumel remains manual-only for EVERY hotel.
