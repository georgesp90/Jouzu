# Jozu Plus Subscription Setup

Jozu Plus gates:

- Unlimited Practice
- Review Practice

Daily Mode remains free.

## RevenueCat setup

The app uses `react-native-purchases` through `utils/subscriptionService.ts`.

Expected RevenueCat entitlement:

- `jozu_plus`

Expected App Store subscription product IDs:

- `com.georgesp9.jozu.monthly`
- `com.georgesp9.jozu.yearly`

After creating the RevenueCat iOS app, place the public iOS SDK key in:

```ts
// utils/subscriptionService.ts
const REVENUECAT_IOS_API_KEY = "";
```

Then run a new EAS build. Expo Go cannot fully test real App Store purchases.

## Testing

Use App Store Connect sandbox testers or TestFlight:

1. Create products in App Store Connect.
2. Attach products to a RevenueCat entitlement named `jozu_plus`.
3. Add monthly/yearly packages to the current RevenueCat offering.
4. Add the RevenueCat iOS SDK key in `utils/subscriptionService.ts`.
5. Build with EAS and test purchase/restore from TestFlight.

## Legacy access

Users created before:

```txt
2026-05-14T00:00:00.000Z
```

are migrated once to:

```ts
entitlements: {
  legacyPlus: true,
  legacyReason: "early_adopter",
  legacyGrantedAt: timestamp
}
```

After migration, the app relies on `entitlements.legacyPlus`.
