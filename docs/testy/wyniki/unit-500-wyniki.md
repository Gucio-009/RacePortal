# Wyniki 500+ testów jednostkowych — `@raceportal/api-types`

**Data (lokalna):** 2026-08-06 14:53:28 CEST
**Data (UTC):** 2026-08-06T12:53:28Z
**Werdykt:** ✅ PASS

## Podsumowanie

| Metryka | Wartość |
|--------|---------|
| Łącznie przypadków | **599** |
| PASS | **599** |
| FAIL | **0** |
| SKIP | 0 |
| Exit code Vitest | 0 |
| Czas (ms, suma assertion) | 32 |

## Zakres

- `carMatchesEventCategory` / aliasy / normalizacja PL (w tym **ł**)
- `partitionCarsForEvent`, `formatCarLabel`
- `EVENT_CATEGORY_GROUPS`, `ALL_EVENT_CATEGORIES`, `CAR_CLASS_OPTIONS`
- awatary: `AVATAR_PRESETS`, `findAvatarPreset`, `userInitials`
- statusy: `eventStatusLabel`, `registrationStatusLabel`, `isOpenRegistration`, `isPositiveRegistration`
- `formatEntryFee`, `eventImage`, `formatEventDate`, `eventDateLabel`

## Uruchomienie

```bash
npm run test:unit
# lub z raportem:
npm run test:unit:report
```

Log: `docs/testy/wyniki/unit-500.log`
JSON: `docs/testy/wyniki/unit-500-raw.json`

## Pełna lista wyników

| # | Status | Przypadek | ms |
|---|--------|-----------|----|
| 1 | ✅ passed | @raceportal/api-types unit suite (598 cases) › suite size is at least 500 (actual 598) | 0.7 |
| 2 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U001: EVENT_CATEGORY_GROUPS is non-empty | 0.1 |
| 3 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U002: ALL_EVENT_CATEGORIES has expected size | 0.1 |
| 4 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U003: CAR_CLASS_OPTIONS excludes Inne | 0.3 |
| 5 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U004: category names are unique | 0.1 |
| 6 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U005: group "Rajdy" has items | 0.1 |
| 7 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U006: "Rajdy" belongs to group "Rajdy" | 0.1 |
| 8 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U007: "Rajdy" is trimmed non-empty | 0.1 |
| 9 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U008: "KJS" belongs to group "Rajdy" | 0.1 |
| 10 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U009: "KJS" is trimmed non-empty | 0.1 |
| 11 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U010: "RallySprint" belongs to group "Rajdy" | 0.1 |
| 12 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U011: "RallySprint" is trimmed non-empty | 0.0 |
| 13 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U012: "SuperOES" belongs to group "Rajdy" | 0.1 |
| 14 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U013: "SuperOES" is trimmed non-empty | 0.0 |
| 15 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U014: "Super Sprint" belongs to group "Rajdy" | 0.1 |
| 16 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U015: "Super Sprint" is trimmed non-empty | 0.0 |
| 17 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U016: "RSMP" belongs to group "Rajdy" | 0.0 |
| 18 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U017: "RSMP" is trimmed non-empty | 0.0 |
| 19 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U018: "SKJS" belongs to group "Rajdy" | 0.0 |
| 20 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U019: "SKJS" is trimmed non-empty | 0.0 |
| 21 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U020: "HRSMP" belongs to group "Rajdy" | 0.0 |
| 22 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U021: "HRSMP" is trimmed non-empty | 0.0 |
| 23 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U022: group "Wyścigi" has items | 0.0 |
| 24 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U023: "Wyścigi górskie" belongs to group "Wyścigi" | 0.1 |
| 25 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U024: "Wyścigi górskie" is trimmed non-empty | 0.0 |
| 26 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U025: "Rallycross" belongs to group "Wyścigi" | 0.1 |
| 27 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U026: "Rallycross" is trimmed non-empty | 0.0 |
| 28 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U027: "Wrak race" belongs to group "Wyścigi" | 0.0 |
| 29 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U028: "Wrak race" is trimmed non-empty | 0.0 |
| 30 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U029: "Time Attack" belongs to group "Wyścigi" | 0.0 |
| 31 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U030: "Time Attack" is trimmed non-empty | 0.0 |
| 32 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U031: "Track Day" belongs to group "Wyścigi" | 0.0 |
| 33 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U032: "Track Day" is trimmed non-empty | 0.0 |
| 34 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U033: "Drag race" belongs to group "Wyścigi" | 0.0 |
| 35 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U034: "Drag race" is trimmed non-empty | 0.0 |
| 36 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U035: "Sprint" belongs to group "Wyścigi" | 0.0 |
| 37 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U036: "Sprint" is trimmed non-empty | 0.0 |
| 38 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U037: "GT Racing" belongs to group "Wyścigi" | 0.0 |
| 39 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U038: "GT Racing" is trimmed non-empty | 0.0 |
| 40 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U039: "Endurance" belongs to group "Wyścigi" | 0.0 |
| 41 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U040: "Endurance" is trimmed non-empty | 0.0 |
| 42 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U041: "MPWS" belongs to group "Wyścigi" | 0.0 |
| 43 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U042: "MPWS" is trimmed non-empty | 0.0 |
| 44 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U043: "Racing" belongs to group "Wyścigi" | 0.0 |
| 45 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U044: "Racing" is trimmed non-empty | 0.0 |
| 46 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U045: group "Drift" has items | 0.0 |
| 47 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U046: "Drift" belongs to group "Drift" | 0.0 |
| 48 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U047: "Drift" is trimmed non-empty | 0.0 |
| 49 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U048: "Drift trening" belongs to group "Drift" | 0.0 |
| 50 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U049: "Drift trening" is trimmed non-empty | 0.0 |
| 51 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U050: "Drift amatorskie" belongs to group "Drift" | 0.0 |
| 52 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U051: "Drift amatorskie" is trimmed non-empty | 0.0 |
| 53 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U052: "Drift pro" belongs to group "Drift" | 0.0 |
| 54 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U053: "Drift pro" is trimmed non-empty | 0.0 |
| 55 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U054: group "Inne" has items | 0.0 |
| 56 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U055: "Inne" belongs to group "Inne" | 0.0 |
| 57 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U056: "Inne" is trimmed non-empty | 0.0 |
| 58 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U057: car class matches itself: Rajdy | 0.3 |
| 59 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U058: car class matches uppercase: Rajdy | 0.0 |
| 60 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U059: car class matches padded: Rajdy | 0.0 |
| 61 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U060: car class does not match empty event: Rajdy | 0.1 |
| 62 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U061: car class matches itself: KJS | 0.0 |
| 63 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U062: car class matches uppercase: KJS | 0.0 |
| 64 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U063: car class matches padded: KJS | 0.0 |
| 65 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U064: car class does not match empty event: KJS | 0.0 |
| 66 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U065: car class matches itself: RallySprint | 0.0 |
| 67 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U066: car class matches uppercase: RallySprint | 0.0 |
| 68 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U067: car class matches padded: RallySprint | 0.0 |
| 69 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U068: car class does not match empty event: RallySprint | 0.0 |
| 70 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U069: car class matches itself: SuperOES | 0.0 |
| 71 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U070: car class matches uppercase: SuperOES | 0.0 |
| 72 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U071: car class matches padded: SuperOES | 0.0 |
| 73 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U072: car class does not match empty event: SuperOES | 0.0 |
| 74 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U073: car class matches itself: Super Sprint | 0.0 |
| 75 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U074: car class matches uppercase: Super Sprint | 0.0 |
| 76 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U075: car class matches padded: Super Sprint | 0.0 |
| 77 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U076: car class does not match empty event: Super Sprint | 0.0 |
| 78 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U077: car class matches itself: RSMP | 0.0 |
| 79 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U078: car class matches uppercase: RSMP | 0.0 |
| 80 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U079: car class matches padded: RSMP | 0.0 |
| 81 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U080: car class does not match empty event: RSMP | 0.0 |
| 82 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U081: car class matches itself: SKJS | 0.0 |
| 83 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U082: car class matches uppercase: SKJS | 0.0 |
| 84 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U083: car class matches padded: SKJS | 0.0 |
| 85 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U084: car class does not match empty event: SKJS | 0.0 |
| 86 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U085: car class matches itself: HRSMP | 0.0 |
| 87 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U086: car class matches uppercase: HRSMP | 0.0 |
| 88 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U087: car class matches padded: HRSMP | 0.0 |
| 89 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U088: car class does not match empty event: HRSMP | 0.0 |
| 90 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U089: car class matches itself: Wyścigi górskie | 0.2 |
| 91 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U090: car class matches uppercase: Wyścigi górskie | 0.0 |
| 92 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U091: car class matches padded: Wyścigi górskie | 0.0 |
| 93 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U092: car class does not match empty event: Wyścigi górskie | 0.0 |
| 94 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U093: car class matches itself: Rallycross | 0.0 |
| 95 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U094: car class matches uppercase: Rallycross | 0.0 |
| 96 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U095: car class matches padded: Rallycross | 0.5 |
| 97 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U096: car class does not match empty event: Rallycross | 0.0 |
| 98 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U097: car class matches itself: Wrak race | 0.0 |
| 99 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U098: car class matches uppercase: Wrak race | 0.0 |
| 100 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U099: car class matches padded: Wrak race | 0.0 |
| 101 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U100: car class does not match empty event: Wrak race | 0.0 |
| 102 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U101: car class matches itself: Time Attack | 0.0 |
| 103 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U102: car class matches uppercase: Time Attack | 0.0 |
| 104 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U103: car class matches padded: Time Attack | 0.0 |
| 105 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U104: car class does not match empty event: Time Attack | 0.0 |
| 106 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U105: car class matches itself: Track Day | 0.0 |
| 107 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U106: car class matches uppercase: Track Day | 0.0 |
| 108 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U107: car class matches padded: Track Day | 0.0 |
| 109 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U108: car class does not match empty event: Track Day | 0.0 |
| 110 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U109: car class matches itself: Drag race | 0.0 |
| 111 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U110: car class matches uppercase: Drag race | 0.0 |
| 112 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U111: car class matches padded: Drag race | 0.0 |
| 113 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U112: car class does not match empty event: Drag race | 0.0 |
| 114 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U113: car class matches itself: Sprint | 0.0 |
| 115 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U114: car class matches uppercase: Sprint | 0.0 |
| 116 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U115: car class matches padded: Sprint | 0.0 |
| 117 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U116: car class does not match empty event: Sprint | 0.0 |
| 118 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U117: car class matches itself: GT Racing | 0.0 |
| 119 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U118: car class matches uppercase: GT Racing | 0.0 |
| 120 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U119: car class matches padded: GT Racing | 0.0 |
| 121 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U120: car class does not match empty event: GT Racing | 0.0 |
| 122 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U121: car class matches itself: Endurance | 0.0 |
| 123 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U122: car class matches uppercase: Endurance | 0.0 |
| 124 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U123: car class matches padded: Endurance | 0.0 |
| 125 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U124: car class does not match empty event: Endurance | 0.0 |
| 126 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U125: car class matches itself: MPWS | 0.0 |
| 127 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U126: car class matches uppercase: MPWS | 0.0 |
| 128 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U127: car class matches padded: MPWS | 0.0 |
| 129 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U128: car class does not match empty event: MPWS | 0.0 |
| 130 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U129: car class matches itself: Racing | 0.0 |
| 131 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U130: car class matches uppercase: Racing | 0.0 |
| 132 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U131: car class matches padded: Racing | 0.1 |
| 133 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U132: car class does not match empty event: Racing | 0.0 |
| 134 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U133: car class matches itself: Drift | 0.0 |
| 135 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U134: car class matches uppercase: Drift | 0.0 |
| 136 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U135: car class matches padded: Drift | 0.0 |
| 137 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U136: car class does not match empty event: Drift | 0.0 |
| 138 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U137: car class matches itself: Drift trening | 0.0 |
| 139 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U138: car class matches uppercase: Drift trening | 0.0 |
| 140 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U139: car class matches padded: Drift trening | 0.0 |
| 141 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U140: car class does not match empty event: Drift trening | 0.0 |
| 142 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U141: car class matches itself: Drift amatorskie | 0.0 |
| 143 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U142: car class matches uppercase: Drift amatorskie | 0.0 |
| 144 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U143: car class matches padded: Drift amatorskie | 0.0 |
| 145 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U144: car class does not match empty event: Drift amatorskie | 0.0 |
| 146 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U145: car class matches itself: Drift pro | 0.0 |
| 147 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U146: car class matches uppercase: Drift pro | 0.0 |
| 148 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U147: car class matches padded: Drift pro | 0.0 |
| 149 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U148: car class does not match empty event: Drift pro | 0.0 |
| 150 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U149: alias Drift ↔ drifting => true | 0.1 |
| 151 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U150: alias Drift ↔ Drift trening => true | 0.0 |
| 152 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U151: alias Drift ↔ Drift amatorskie => true | 0.0 |
| 153 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U152: alias Drift ↔ Drift pro => true | 0.0 |
| 154 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U153: alias Drift ↔ DRIFTER => true | 0.0 |
| 155 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U154: alias GT Racing ↔ GT => true | 0.0 |
| 156 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U155: alias GT Racing ↔ gt4 => true | 0.0 |
| 157 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U156: alias GT Racing ↔ GTR => true | 0.0 |
| 158 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U157: alias GT Racing ↔ Cup => true | 0.0 |
| 159 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U158: alias Rally ↔ Rajd => true | 0.0 |
| 160 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U159: alias Rally ↔ KJS => true | 0.0 |
| 161 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U160: alias Rally ↔ RallySprint => true | 0.0 |
| 162 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U161: alias Rally ↔ SuperOES => true | 0.0 |
| 163 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U162: alias Rally ↔ RSMP => true | 0.1 |
| 164 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U163: alias Rally ↔ HRSMP => true | 0.0 |
| 165 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U164: alias Endurance ↔ długodystans => true | 0.1 |
| 166 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U165: alias Endurance ↔ dlugodystans => true | 0.0 |
| 167 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U166: alias Time Attack ↔ timeattack => true | 0.1 |
| 168 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U167: alias Time Attack ↔ TA => true | 0.0 |
| 169 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U168: alias Racing ↔ Wyścigi górskie => true | 0.1 |
| 170 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U169: alias Racing ↔ Sprint => true | 0.1 |
| 171 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U170: alias Racing ↔ Drag race => true | 0.1 |
| 172 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U171: alias Racing ↔ Wrak race => true | 0.1 |
| 173 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U172: alias Racing ↔ Rallycross => true | 0.1 |
| 174 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U173: alias Track Day ↔ trackday => true | 0.1 |
| 175 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U174: alias Track Day ↔ TD => true | 0.1 |
| 176 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U175: alias MPWS ↔ mpws => true | 0.0 |
| 177 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U176: alias Drift ↔ Endurance => false | 0.0 |
| 178 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U177: alias GT Racing ↔ Drift => false | 0.0 |
| 179 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U178: alias Track Day ↔ Drift pro => false | 0.0 |
| 180 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U179: alias MPWS ↔ Rally => false | 0.1 |
| 181 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U180: alias Time Attack ↔ Drift => false | 0.0 |
| 182 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U181: alias Wyścigi górskie ↔ Drift => false | 0.0 |
| 183 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U182: alias KJS ↔ Endurance => false | 0.1 |
| 184 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U183: alias Sprint ↔ Drift trening => false | 0.1 |
| 185 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U184: empty carClass rejected: null | 0.0 |
| 186 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U185: empty carClass rejected: undefined | 0.0 |
| 187 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U186: empty carClass rejected: "" | 0.0 |
| 188 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U187: empty carClass rejected: "  " | 0.0 |
| 189 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U188: empty carClass rejected: "\t" | 0.0 |
| 190 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U189: matrix Rajdy vs Drift | 0.0 |
| 191 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U190: matrix Rajdy vs GT Racing | 0.0 |
| 192 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U191: matrix Rajdy vs Rally | 0.0 |
| 193 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U192: matrix Rajdy vs Endurance | 0.0 |
| 194 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U193: matrix Rajdy vs Time Attack | 0.0 |
| 195 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U194: matrix Rajdy vs Track Day | 0.0 |
| 196 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U195: matrix Rajdy vs MPWS | 0.0 |
| 197 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U196: matrix Rajdy vs Inne | 0.1 |
| 198 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U197: matrix KJS vs Drift | 0.0 |
| 199 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U198: matrix KJS vs GT Racing | 0.0 |
| 200 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U199: matrix KJS vs Rally | 0.0 |
| 201 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U200: matrix KJS vs Endurance | 0.0 |
| 202 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U201: matrix KJS vs Time Attack | 0.0 |
| 203 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U202: matrix KJS vs Track Day | 0.0 |
| 204 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U203: matrix KJS vs MPWS | 0.0 |
| 205 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U204: matrix KJS vs Inne | 0.1 |
| 206 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U205: matrix RallySprint vs Drift | 0.0 |
| 207 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U206: matrix RallySprint vs GT Racing | 0.0 |
| 208 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U207: matrix RallySprint vs Rally | 0.0 |
| 209 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U208: matrix RallySprint vs Endurance | 0.0 |
| 210 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U209: matrix RallySprint vs Time Attack | 0.0 |
| 211 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U210: matrix RallySprint vs Track Day | 0.0 |
| 212 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U211: matrix RallySprint vs MPWS | 0.0 |
| 213 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U212: matrix RallySprint vs Inne | 0.0 |
| 214 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U213: matrix SuperOES vs Drift | 0.1 |
| 215 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U214: matrix SuperOES vs GT Racing | 0.0 |
| 216 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U215: matrix SuperOES vs Rally | 0.0 |
| 217 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U216: matrix SuperOES vs Endurance | 0.8 |
| 218 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U217: matrix SuperOES vs Time Attack | 0.0 |
| 219 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U218: matrix SuperOES vs Track Day | 0.0 |
| 220 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U219: matrix SuperOES vs MPWS | 0.0 |
| 221 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U220: matrix SuperOES vs Inne | 0.0 |
| 222 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U221: matrix Super Sprint vs Drift | 0.0 |
| 223 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U222: matrix Super Sprint vs GT Racing | 0.0 |
| 224 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U223: matrix Super Sprint vs Rally | 0.0 |
| 225 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U224: matrix Super Sprint vs Endurance | 0.0 |
| 226 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U225: matrix Super Sprint vs Time Attack | 0.0 |
| 227 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U226: matrix Super Sprint vs Track Day | 0.0 |
| 228 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U227: matrix Super Sprint vs MPWS | 0.0 |
| 229 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U228: matrix Super Sprint vs Inne | 0.0 |
| 230 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U229: matrix RSMP vs Drift | 0.0 |
| 231 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U230: matrix RSMP vs GT Racing | 0.0 |
| 232 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U231: matrix RSMP vs Rally | 0.0 |
| 233 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U232: matrix RSMP vs Endurance | 0.0 |
| 234 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U233: matrix RSMP vs Time Attack | 0.0 |
| 235 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U234: matrix RSMP vs Track Day | 0.0 |
| 236 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U235: matrix RSMP vs MPWS | 0.0 |
| 237 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U236: matrix RSMP vs Inne | 0.0 |
| 238 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U237: matrix SKJS vs Drift | 0.0 |
| 239 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U238: matrix SKJS vs GT Racing | 0.0 |
| 240 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U239: matrix SKJS vs Rally | 0.0 |
| 241 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U240: matrix SKJS vs Endurance | 0.0 |
| 242 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U241: matrix SKJS vs Time Attack | 0.0 |
| 243 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U242: matrix SKJS vs Track Day | 0.0 |
| 244 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U243: matrix SKJS vs MPWS | 0.0 |
| 245 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U244: matrix SKJS vs Inne | 0.0 |
| 246 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U245: matrix HRSMP vs Drift | 0.0 |
| 247 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U246: matrix HRSMP vs GT Racing | 0.0 |
| 248 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U247: matrix HRSMP vs Rally | 0.0 |
| 249 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U248: matrix HRSMP vs Endurance | 0.0 |
| 250 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U249: matrix HRSMP vs Time Attack | 0.0 |
| 251 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U250: matrix HRSMP vs Track Day | 0.0 |
| 252 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U251: matrix HRSMP vs MPWS | 0.0 |
| 253 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U252: matrix HRSMP vs Inne | 0.0 |
| 254 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U253: matrix Wyścigi górskie vs Drift | 0.0 |
| 255 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U254: matrix Wyścigi górskie vs GT Racing | 0.0 |
| 256 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U255: matrix Wyścigi górskie vs Rally | 0.0 |
| 257 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U256: matrix Wyścigi górskie vs Endurance | 0.0 |
| 258 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U257: matrix Wyścigi górskie vs Time Attack | 0.0 |
| 259 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U258: matrix Wyścigi górskie vs Track Day | 0.0 |
| 260 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U259: matrix Wyścigi górskie vs MPWS | 0.0 |
| 261 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U260: matrix Wyścigi górskie vs Inne | 0.0 |
| 262 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U261: matrix Rallycross vs Drift | 0.0 |
| 263 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U262: matrix Rallycross vs GT Racing | 0.0 |
| 264 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U263: matrix Rallycross vs Rally | 0.0 |
| 265 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U264: matrix Rallycross vs Endurance | 0.0 |
| 266 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U265: matrix Rallycross vs Time Attack | 0.0 |
| 267 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U266: matrix Rallycross vs Track Day | 0.0 |
| 268 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U267: matrix Rallycross vs MPWS | 0.0 |
| 269 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U268: matrix Rallycross vs Inne | 0.0 |
| 270 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U269: matrix Wrak race vs Drift | 0.0 |
| 271 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U270: matrix Wrak race vs GT Racing | 0.0 |
| 272 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U271: matrix Wrak race vs Rally | 0.0 |
| 273 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U272: matrix Wrak race vs Endurance | 0.0 |
| 274 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U273: matrix Wrak race vs Time Attack | 0.0 |
| 275 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U274: matrix Wrak race vs Track Day | 0.0 |
| 276 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U275: matrix Wrak race vs MPWS | 0.0 |
| 277 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U276: matrix Wrak race vs Inne | 0.0 |
| 278 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U277: matrix Time Attack vs Drift | 0.0 |
| 279 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U278: matrix Time Attack vs GT Racing | 0.0 |
| 280 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U279: matrix Time Attack vs Rally | 0.0 |
| 281 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U280: matrix Time Attack vs Endurance | 0.0 |
| 282 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U281: matrix Time Attack vs Time Attack | 0.0 |
| 283 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U282: matrix Time Attack vs Track Day | 0.0 |
| 284 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U283: matrix Time Attack vs MPWS | 0.0 |
| 285 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U284: matrix Time Attack vs Inne | 0.0 |
| 286 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U285: matrix Track Day vs Drift | 0.0 |
| 287 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U286: matrix Track Day vs GT Racing | 0.0 |
| 288 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U287: matrix Track Day vs Rally | 0.0 |
| 289 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U288: matrix Track Day vs Endurance | 0.0 |
| 290 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U289: matrix Track Day vs Time Attack | 0.0 |
| 291 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U290: matrix Track Day vs Track Day | 0.0 |
| 292 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U291: matrix Track Day vs MPWS | 0.0 |
| 293 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U292: matrix Track Day vs Inne | 0.0 |
| 294 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U293: matrix Drag race vs Drift | 0.0 |
| 295 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U294: matrix Drag race vs GT Racing | 0.0 |
| 296 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U295: matrix Drag race vs Rally | 0.0 |
| 297 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U296: matrix Drag race vs Endurance | 0.0 |
| 298 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U297: matrix Drag race vs Time Attack | 0.0 |
| 299 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U298: matrix Drag race vs Track Day | 0.0 |
| 300 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U299: matrix Drag race vs MPWS | 0.0 |
| 301 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U300: matrix Drag race vs Inne | 0.0 |
| 302 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U301: matrix Sprint vs Drift | 0.0 |
| 303 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U302: matrix Sprint vs GT Racing | 0.0 |
| 304 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U303: matrix Sprint vs Rally | 0.0 |
| 305 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U304: matrix Sprint vs Endurance | 0.0 |
| 306 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U305: matrix Sprint vs Time Attack | 0.0 |
| 307 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U306: matrix Sprint vs Track Day | 0.0 |
| 308 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U307: matrix Sprint vs MPWS | 0.0 |
| 309 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U308: matrix Sprint vs Inne | 0.0 |
| 310 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U309: matrix GT Racing vs Drift | 0.0 |
| 311 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U310: matrix GT Racing vs GT Racing | 0.0 |
| 312 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U311: matrix GT Racing vs Rally | 0.0 |
| 313 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U312: matrix GT Racing vs Endurance | 0.0 |
| 314 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U313: matrix GT Racing vs Time Attack | 0.0 |
| 315 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U314: matrix GT Racing vs Track Day | 0.0 |
| 316 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U315: matrix GT Racing vs MPWS | 0.0 |
| 317 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U316: matrix GT Racing vs Inne | 0.0 |
| 318 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U317: matrix Endurance vs Drift | 0.0 |
| 319 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U318: matrix Endurance vs GT Racing | 0.0 |
| 320 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U319: matrix Endurance vs Rally | 0.0 |
| 321 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U320: matrix Endurance vs Endurance | 0.0 |
| 322 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U321: matrix Endurance vs Time Attack | 0.0 |
| 323 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U322: matrix Endurance vs Track Day | 0.0 |
| 324 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U323: matrix Endurance vs MPWS | 0.0 |
| 325 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U324: matrix Endurance vs Inne | 0.0 |
| 326 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U325: matrix MPWS vs Drift | 0.0 |
| 327 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U326: matrix MPWS vs GT Racing | 0.0 |
| 328 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U327: matrix MPWS vs Rally | 0.0 |
| 329 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U328: matrix MPWS vs Endurance | 0.0 |
| 330 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U329: matrix MPWS vs Time Attack | 0.0 |
| 331 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U330: matrix MPWS vs Track Day | 0.0 |
| 332 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U331: matrix MPWS vs MPWS | 0.0 |
| 333 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U332: matrix MPWS vs Inne | 0.0 |
| 334 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U333: matrix Racing vs Drift | 0.0 |
| 335 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U334: matrix Racing vs GT Racing | 0.0 |
| 336 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U335: matrix Racing vs Rally | 0.0 |
| 337 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U336: matrix Racing vs Endurance | 0.0 |
| 338 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U337: matrix Racing vs Time Attack | 0.0 |
| 339 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U338: matrix Racing vs Track Day | 0.0 |
| 340 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U339: matrix Racing vs MPWS | 0.0 |
| 341 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U340: matrix Racing vs Inne | 0.0 |
| 342 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U341: matrix Drift vs Drift | 0.0 |
| 343 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U342: matrix Drift vs GT Racing | 0.0 |
| 344 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U343: matrix Drift vs Rally | 0.0 |
| 345 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U344: matrix Drift vs Endurance | 0.0 |
| 346 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U345: matrix Drift vs Time Attack | 0.0 |
| 347 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U346: matrix Drift vs Track Day | 0.0 |
| 348 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U347: matrix Drift vs MPWS | 0.0 |
| 349 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U348: matrix Drift vs Inne | 0.0 |
| 350 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U349: matrix Drift trening vs Drift | 0.0 |
| 351 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U350: matrix Drift trening vs GT Racing | 0.0 |
| 352 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U351: matrix Drift trening vs Rally | 0.0 |
| 353 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U352: matrix Drift trening vs Endurance | 0.0 |
| 354 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U353: matrix Drift trening vs Time Attack | 0.0 |
| 355 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U354: matrix Drift trening vs Track Day | 0.0 |
| 356 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U355: matrix Drift trening vs MPWS | 0.0 |
| 357 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U356: matrix Drift trening vs Inne | 0.0 |
| 358 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U357: matrix Drift amatorskie vs Drift | 0.0 |
| 359 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U358: matrix Drift amatorskie vs GT Racing | 0.0 |
| 360 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U359: matrix Drift amatorskie vs Rally | 0.0 |
| 361 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U360: matrix Drift amatorskie vs Endurance | 0.0 |
| 362 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U361: matrix Drift amatorskie vs Time Attack | 0.0 |
| 363 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U362: matrix Drift amatorskie vs Track Day | 0.0 |
| 364 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U363: matrix Drift amatorskie vs MPWS | 0.0 |
| 365 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U364: matrix Drift amatorskie vs Inne | 0.0 |
| 366 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U365: matrix Drift pro vs Drift | 0.0 |
| 367 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U366: matrix Drift pro vs GT Racing | 0.0 |
| 368 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U367: matrix Drift pro vs Rally | 0.0 |
| 369 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U368: matrix Drift pro vs Endurance | 0.0 |
| 370 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U369: matrix Drift pro vs Time Attack | 0.0 |
| 371 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U370: matrix Drift pro vs Track Day | 0.0 |
| 372 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U371: matrix Drift pro vs MPWS | 0.0 |
| 373 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U372: matrix Drift pro vs Inne | 0.0 |
| 374 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U373: formatCarLabel plain: c0 | 0.1 |
| 375 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U374: formatCarLabel recommended: c0 | 0.0 |
| 376 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U375: formatCarLabel without year still works: c0 | 0.0 |
| 377 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U376: formatCarLabel plain: c1 | 0.0 |
| 378 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U377: formatCarLabel recommended: c1 | 0.0 |
| 379 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U378: formatCarLabel without year still works: c1 | 0.0 |
| 380 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U379: formatCarLabel plain: c2 | 0.0 |
| 381 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U380: formatCarLabel recommended: c2 | 0.0 |
| 382 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U381: formatCarLabel without year still works: c2 | 0.0 |
| 383 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U382: formatCarLabel plain: c3 | 0.0 |
| 384 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U383: formatCarLabel recommended: c3 | 0.0 |
| 385 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U384: formatCarLabel without year still works: c3 | 0.0 |
| 386 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U385: formatCarLabel plain: c4 | 0.0 |
| 387 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U386: formatCarLabel recommended: c4 | 0.0 |
| 388 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U387: formatCarLabel without year still works: c4 | 0.0 |
| 389 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U388: formatCarLabel plain: c5 | 0.0 |
| 390 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U389: formatCarLabel recommended: c5 | 0.0 |
| 391 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U390: formatCarLabel without year still works: c5 | 0.0 |
| 392 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U391: formatCarLabel plain: c6 | 0.0 |
| 393 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U392: formatCarLabel recommended: c6 | 0.0 |
| 394 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U393: formatCarLabel without year still works: c6 | 0.0 |
| 395 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U394: formatCarLabel plain: c7 | 0.0 |
| 396 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U395: formatCarLabel recommended: c7 | 0.0 |
| 397 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U396: formatCarLabel without year still works: c7 | 0.0 |
| 398 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U397: formatCarLabel plain: c8 | 0.0 |
| 399 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U398: formatCarLabel recommended: c8 | 0.6 |
| 400 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U399: formatCarLabel without year still works: c8 | 0.0 |
| 401 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U400: formatCarLabel plain: c9 | 0.0 |
| 402 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U401: formatCarLabel recommended: c9 | 0.0 |
| 403 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U402: formatCarLabel without year still works: c9 | 0.0 |
| 404 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U403: formatCarLabel plain: c10 | 0.0 |
| 405 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U404: formatCarLabel recommended: c10 | 0.0 |
| 406 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U405: formatCarLabel without year still works: c10 | 0.0 |
| 407 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U406: formatCarLabel plain: c11 | 0.0 |
| 408 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U407: formatCarLabel recommended: c11 | 0.0 |
| 409 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U408: formatCarLabel without year still works: c11 | 0.0 |
| 410 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U409: partitionCarsForEvent for Drift | 0.3 |
| 411 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U410: partitionCarsForEvent for GT Racing | 0.4 |
| 412 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U411: partitionCarsForEvent for Rally | 0.4 |
| 413 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U412: partitionCarsForEvent for Endurance | 0.4 |
| 414 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U413: partitionCarsForEvent for Track Day | 0.5 |
| 415 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U414: partition empty garage | 0.2 |
| 416 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U415: AVATAR_PRESETS has 12 entries | 0.0 |
| 417 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U416: avatar ids are unique | 0.0 |
| 418 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U417: avatar urls are unique | 0.0 |
| 419 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U418: preset racer has https dicebear url | 0.0 |
| 420 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U419: findAvatarPreset finds racer | 0.0 |
| 421 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U420: preset pilot has https dicebear url | 0.0 |
| 422 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U421: findAvatarPreset finds pilot | 0.0 |
| 423 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U422: preset mechanic has https dicebear url | 0.0 |
| 424 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U423: findAvatarPreset finds mechanic | 0.0 |
| 425 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U424: preset drift has https dicebear url | 0.0 |
| 426 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U425: findAvatarPreset finds drift | 0.0 |
| 427 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U426: preset rally has https dicebear url | 0.0 |
| 428 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U427: findAvatarPreset finds rally | 0.0 |
| 429 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U428: preset gt has https dicebear url | 0.0 |
| 430 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U429: findAvatarPreset finds gt | 0.0 |
| 431 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U430: preset cup has https dicebear url | 0.0 |
| 432 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U431: findAvatarPreset finds cup | 0.0 |
| 433 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U432: preset night has https dicebear url | 0.0 |
| 434 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U433: findAvatarPreset finds night | 0.0 |
| 435 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U434: preset grid has https dicebear url | 0.0 |
| 436 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U435: findAvatarPreset finds grid | 0.0 |
| 437 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U436: preset pace has https dicebear url | 0.0 |
| 438 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U437: findAvatarPreset finds pace | 0.0 |
| 439 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U438: preset crew has https dicebear url | 0.0 |
| 440 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U439: findAvatarPreset finds crew | 0.0 |
| 441 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U440: preset flag has https dicebear url | 0.0 |
| 442 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U441: findAvatarPreset finds flag | 0.0 |
| 443 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U442: findAvatarPreset null/empty/unknown | 0.0 |
| 444 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U443: userInitials {"firstName":"Jan","lastName":"Kowalski"} => JK | 0.0 |
| 445 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U444: userInitials {"firstName":"anna","lastName":"nowak"} => AN | 0.0 |
| 446 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U445: userInitials {"firstName":"Łukasz","lastName":"Żurek"} => ŁŻ | 0.0 |
| 447 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U446: userInitials {"firstName":"Ab","lastName":null} => AB | 0.0 |
| 448 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U447: userInitials {"firstName":"A","lastName":null,"username":"pilot"} => PI | 0.0 |
| 449 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U448: userInitials {"firstName":"Zosia","lastName":""} => ZO | 0.0 |
| 450 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U449: userInitials {"username":"xy"} => XY | 0.0 |
| 451 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U450: userInitials {"username":"x"} => X | 0.0 |
| 452 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U451: userInitials {} => ? | 0.0 |
| 453 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U452: userInitials {"firstName":"  Ewa  ","lastName":"  Lis  "} => EL | 0.0 |
| 454 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U453: userInitials {"firstName":"Miłosz","lastName":"Ćwik"} => MĆ | 0.0 |
| 455 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U454: userInitials {"firstName":"  ","username":"grid"} => GR | 0.0 |
| 456 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U455: eventStatusLabel DRAFT | 0.1 |
| 457 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U456: eventStatusLabel PENDING | 0.0 |
| 458 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U457: eventStatusLabel APPROVED | 0.0 |
| 459 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U458: eventStatusLabel REJECTED | 0.0 |
| 460 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U459: eventStatusLabel ARCHIVED | 0.0 |
| 461 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U460: eventStatusLabel CANCELLED | 0.0 |
| 462 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U461: registrationStatusLabel PENDING | 0.0 |
| 463 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U462: isOpenRegistration PENDING | 0.0 |
| 464 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U463: isPositiveRegistration PENDING | 0.0 |
| 465 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U464: registrationStatusLabel ACCEPTED | 0.0 |
| 466 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U465: isOpenRegistration ACCEPTED | 0.0 |
| 467 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U466: isPositiveRegistration ACCEPTED | 0.0 |
| 468 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U467: registrationStatusLabel CONFIRMED | 0.0 |
| 469 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U468: isOpenRegistration CONFIRMED | 0.0 |
| 470 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U469: isPositiveRegistration CONFIRMED | 0.0 |
| 471 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U470: registrationStatusLabel CANCELED | 0.0 |
| 472 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U471: isOpenRegistration CANCELED | 0.0 |
| 473 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U472: isPositiveRegistration CANCELED | 0.0 |
| 474 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U473: registrationStatusLabel APPROVED | 0.0 |
| 475 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U474: isOpenRegistration APPROVED | 0.0 |
| 476 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U475: isPositiveRegistration APPROVED | 0.0 |
| 477 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U476: registrationStatusLabel REJECTED | 0.0 |
| 478 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U477: isOpenRegistration REJECTED | 0.0 |
| 479 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U478: isPositiveRegistration REJECTED | 0.0 |
| 480 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U479: registrationStatusLabel CANCELLED | 0.0 |
| 481 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U480: isOpenRegistration CANCELLED | 0.0 |
| 482 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U481: isPositiveRegistration CANCELLED | 0.0 |
| 483 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U482: formatEntryFee nullish null | 0.0 |
| 484 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U483: formatEntryFee nullish undefined | 0.0 |
| 485 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U484: formatEntryFee nullish NaN | 0.0 |
| 486 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U485: formatEntryFee 0 ends with PLN | 7.6 |
| 487 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U486: formatEntryFee 100 ends with PLN | 0.1 |
| 488 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U487: formatEntryFee 890 ends with PLN | 0.0 |
| 489 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U488: formatEntryFee 12.5 ends with PLN | 0.0 |
| 490 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U489: formatEntryFee 12.55 ends with PLN | 0.0 |
| 491 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U490: formatEntryFee 1000 ends with PLN | 0.0 |
| 492 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U491: formatEntryFee 1999.99 ends with PLN | 0.0 |
| 493 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U492: formatEntryFee 50 ends with PLN | 0.0 |
| 494 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U493: formatEntryFee 75 ends with PLN | 0.0 |
| 495 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U494: formatEntryFee 250 ends with PLN | 0.0 |
| 496 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U495: formatEntryFee smoke 25 | 0.1 |
| 497 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U496: formatEntryFee smoke 50 | 0.0 |
| 498 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U497: formatEntryFee smoke 75 | 0.0 |
| 499 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U498: formatEntryFee smoke 100 | 0.0 |
| 500 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U499: formatEntryFee smoke 125 | 0.0 |
| 501 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U500: formatEntryFee smoke 150 | 0.0 |
| 502 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U501: formatEntryFee smoke 175 | 0.0 |
| 503 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U502: formatEntryFee smoke 200 | 0.0 |
| 504 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U503: formatEntryFee smoke 225 | 0.0 |
| 505 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U504: formatEntryFee smoke 250 | 0.0 |
| 506 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U505: formatEntryFee smoke 275 | 0.0 |
| 507 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U506: formatEntryFee smoke 300 | 0.0 |
| 508 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U507: formatEntryFee smoke 325 | 0.0 |
| 509 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U508: formatEntryFee smoke 350 | 0.0 |
| 510 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U509: formatEntryFee smoke 375 | 0.0 |
| 511 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U510: formatEntryFee smoke 400 | 0.1 |
| 512 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U511: formatEntryFee smoke 425 | 0.1 |
| 513 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U512: formatEntryFee smoke 450 | 0.0 |
| 514 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U513: formatEntryFee smoke 475 | 0.0 |
| 515 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U514: formatEntryFee smoke 500 | 0.0 |
| 516 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U515: formatEntryFee smoke 525 | 0.0 |
| 517 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U516: formatEntryFee smoke 550 | 0.1 |
| 518 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U517: formatEntryFee smoke 575 | 0.0 |
| 519 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U518: formatEntryFee smoke 600 | 0.0 |
| 520 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U519: formatEntryFee smoke 625 | 0.0 |
| 521 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U520: formatEntryFee smoke 650 | 0.0 |
| 522 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U521: formatEntryFee smoke 675 | 0.0 |
| 523 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U522: formatEntryFee smoke 700 | 0.0 |
| 524 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U523: formatEntryFee smoke 725 | 0.0 |
| 525 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U524: formatEntryFee smoke 750 | 0.0 |
| 526 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U525: formatEntryFee smoke 775 | 0.0 |
| 527 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U526: formatEntryFee smoke 800 | 0.0 |
| 528 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U527: formatEntryFee smoke 825 | 0.0 |
| 529 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U528: formatEntryFee smoke 850 | 0.0 |
| 530 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U529: formatEntryFee smoke 875 | 0.0 |
| 531 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U530: formatEntryFee smoke 900 | 0.0 |
| 532 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U531: formatEntryFee smoke 925 | 0.0 |
| 533 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U532: formatEntryFee smoke 950 | 0.0 |
| 534 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U533: formatEntryFee smoke 975 | 0.0 |
| 535 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U534: formatEntryFee smoke 1000 | 0.0 |
| 536 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U535: eventImage falls back to DEFAULT_EVENT_IMAGE | 0.1 |
| 537 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U536: eventImage keeps custom url | 0.0 |
| 538 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U537: DEFAULT_IMAGE is shorter unsplash variant | 0.0 |
| 539 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U538: formatEventDate 2026-01-15T00:00:00Z | 2.2 |
| 540 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U539: eventDateLabel prefers dateLabel for 2026-01-15T00:00:00Z | 0.1 |
| 541 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U540: formatEventDate 2026-08-29T12:00:00Z | 0.1 |
| 542 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U541: eventDateLabel prefers dateLabel for 2026-08-29T12:00:00Z | 0.1 |
| 543 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U542: formatEventDate 2026-09-05T00:00:00Z | 0.1 |
| 544 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U543: eventDateLabel prefers dateLabel for 2026-09-05T00:00:00Z | 0.1 |
| 545 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U544: formatEventDate 2026-12-31T23:00:00Z | 0.0 |
| 546 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U545: eventDateLabel prefers dateLabel for 2026-12-31T23:00:00Z | 0.1 |
| 547 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U546: formatEventDate 2025-03-01T00:00:00Z | 0.0 |
| 548 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U547: eventDateLabel prefers dateLabel for 2025-03-01T00:00:00Z | 0.1 |
| 549 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U548: formatEventDate 2027-06-10T08:00:00Z | 0.0 |
| 550 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U549: eventDateLabel prefers dateLabel for 2027-06-10T08:00:00Z | 0.1 |
| 551 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U550: eventDateLabel empty without date | 0.0 |
| 552 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U551: normalize match mixed case spaced: Rajdy | 0.0 |
| 553 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U552: self-includes match for Rajdy | 0.1 |
| 554 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U553: normalize match mixed case spaced: KJS | 0.0 |
| 555 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U554: self-includes match for KJS | 0.0 |
| 556 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U555: normalize match mixed case spaced: RallySprint | 0.0 |
| 557 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U556: self-includes match for RallySprint | 0.1 |
| 558 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U557: normalize match mixed case spaced: SuperOES | 0.0 |
| 559 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U558: self-includes match for SuperOES | 0.0 |
| 560 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U559: normalize match mixed case spaced: Super Sprint | 0.2 |
| 561 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U560: self-includes match for Super Sprint | 0.0 |
| 562 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U561: normalize match mixed case spaced: RSMP | 0.0 |
| 563 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U562: self-includes match for RSMP | 0.0 |
| 564 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U563: normalize match mixed case spaced: SKJS | 0.0 |
| 565 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U564: self-includes match for SKJS | 0.0 |
| 566 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U565: normalize match mixed case spaced: HRSMP | 0.0 |
| 567 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U566: self-includes match for HRSMP | 0.0 |
| 568 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U567: normalize match mixed case spaced: Wyścigi górskie | 0.0 |
| 569 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U568: self-includes match for Wyścigi górskie | 0.1 |
| 570 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U569: normalize match mixed case spaced: Rallycross | 0.0 |
| 571 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U570: self-includes match for Rallycross | 0.0 |
| 572 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U571: normalize match mixed case spaced: Wrak race | 0.0 |
| 573 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U572: self-includes match for Wrak race | 0.0 |
| 574 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U573: normalize match mixed case spaced: Time Attack | 0.0 |
| 575 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U574: self-includes match for Time Attack | 0.0 |
| 576 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U575: normalize match mixed case spaced: Track Day | 0.0 |
| 577 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U576: self-includes match for Track Day | 0.0 |
| 578 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U577: normalize match mixed case spaced: Drag race | 0.0 |
| 579 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U578: self-includes match for Drag race | 0.0 |
| 580 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U579: normalize match mixed case spaced: Sprint | 0.0 |
| 581 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U580: self-includes match for Sprint | 0.0 |
| 582 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U581: normalize match mixed case spaced: GT Racing | 0.0 |
| 583 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U582: self-includes match for GT Racing | 0.0 |
| 584 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U583: normalize match mixed case spaced: Endurance | 0.0 |
| 585 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U584: self-includes match for Endurance | 0.0 |
| 586 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U585: normalize match mixed case spaced: MPWS | 0.0 |
| 587 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U586: self-includes match for MPWS | 0.0 |
| 588 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U587: normalize match mixed case spaced: Racing | 0.0 |
| 589 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U588: self-includes match for Racing | 0.0 |
| 590 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U589: normalize match mixed case spaced: Drift | 0.0 |
| 591 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U590: self-includes match for Drift | 0.0 |
| 592 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U591: normalize match mixed case spaced: Drift trening | 0.0 |
| 593 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U592: self-includes match for Drift trening | 0.0 |
| 594 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U593: normalize match mixed case spaced: Drift amatorskie | 0.0 |
| 595 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U594: self-includes match for Drift amatorskie | 0.0 |
| 596 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U595: normalize match mixed case spaced: Drift pro | 0.0 |
| 597 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U596: self-includes match for Drift pro | 0.0 |
| 598 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U597: normalize match mixed case spaced: Inne | 0.0 |
| 599 | ✅ passed | @raceportal/api-types unit suite (598 cases) › U598: self-includes match for Inne | 0.0 |

---

*Wygenerowano automatycznie przez `scripts/run-unit-500.sh`.*