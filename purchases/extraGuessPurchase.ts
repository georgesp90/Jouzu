import Purchases, {
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesStoreProduct
} from "react-native-purchases";
import { configureSubscriptions, isRevenueCatConfigured } from "@/utils/subscriptionService";

export const EXTRA_GUESS_PRODUCT_ID = "com.georgesp9.jozuhiraganawordle.extra_guess";

export type ExtraGuessProduct = {
  productIdentifier: string;
  priceLabel: string;
  storeProduct: PurchasesStoreProduct;
};

export type ExtraGuessPurchaseResult =
  | { status: "success" }
  | { status: "cancelled"; message: string }
  | { status: "pending"; message: string }
  | { status: "error"; message: string };

export function isExtraGuessAvailable(product: ExtraGuessProduct | null): boolean {
  return isRevenueCatConfigured() && Boolean(product);
}

export async function getExtraGuessProduct(uid: string | null): Promise<ExtraGuessProduct | null> {
  if (!uid || !isRevenueCatConfigured()) {
    return null;
  }

  try {
    await configureSubscriptions(uid);
    const products = await Purchases.getProducts([EXTRA_GUESS_PRODUCT_ID]);
    const product = products.find((entry) => entry.identifier === EXTRA_GUESS_PRODUCT_ID);

    if (!product) {
      return null;
    }

    return {
      productIdentifier: product.identifier,
      priceLabel: product.priceString || "$0.99",
      storeProduct: product
    };
  } catch (error) {
    console.warn("Extra guess product load failed.", error);
    return null;
  }
}

export async function purchaseExtraGuess(
  product: ExtraGuessProduct | null,
  uid: string | null
): Promise<ExtraGuessPurchaseResult> {
  if (!product || !uid || !isRevenueCatConfigured()) {
    return { status: "error", message: "Extra guess is unavailable right now." };
  }

  try {
    await configureSubscriptions(uid);
    await Purchases.purchaseStoreProduct(product.storeProduct);
    return { status: "success" };
  } catch (error) {
    const purchaseError = error as Partial<PurchasesError>;

    if (
      purchaseError.userCancelled === true ||
      purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    ) {
      return { status: "cancelled", message: "Purchase canceled." };
    }

    if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return { status: "pending", message: "Purchase is pending approval." };
    }

    if (
      purchaseError.code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
      purchaseError.code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
    ) {
      return { status: "error", message: "You're offline. Try again when connected." };
    }

    if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
      return { status: "error", message: "Extra guess is unavailable right now." };
    }

    return {
      status: "error",
      message: purchaseError.message || "Could not complete the purchase. Please try again."
    };
  }
}
