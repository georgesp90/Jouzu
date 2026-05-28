# Extra Guess Testing

## Store Setup

- Create a consumable App Store product with identifier `com.georgesp9.jozuhiraganawordle.extra_guess`.
- Attach the product in RevenueCat before testing purchases in TestFlight.
- The purchase is consumable; it does not grant or restore a subscription entitlement.

## Manual Checklist

1. In Daily Mode, submit a wrong final allowed guess and confirm the `One more try?` modal opens without a result card.
2. Tap `Show Answer` and confirm the puzzle records a loss and displays its normal result.
3. Purchase the extra guess and confirm exactly one new guess row becomes available.
4. Solve on the paid row and confirm Daily records a win.
5. Miss on the paid row and confirm Daily records a loss without another purchase offer.
6. Close and reopen while the choice modal is visible; confirm the modal returns.
7. Close and reopen after a successful purchase; confirm the extra row remains available.
8. Confirm Practice Mode and Kana Rush never show this modal.
9. Confirm an unavailable or canceled purchase leaves `Show Answer` usable.
10. Confirm a new Daily puzzle starts without yesterday's extra-guess grant.
