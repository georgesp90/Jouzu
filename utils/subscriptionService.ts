import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesPackage,
  PurchasesStoreProduct
} from "react-native-purchases";
import { Platform } from "react-native";

export const JOZU_PLUS_ENTITLEMENT_ID = "jozu_plus";
export const JOZU_PLUS_MONTHLY_ID = "com.georgesp9.jozu.monthly";
export const JOZU_PLUS_YEARLY_ID = "com.georgesp9.jozu.yearly";

// RevenueCat public SDK keys are safe to ship in-app. Replace this value after
// creating the iOS app in RevenueCat, then rebuild with EAS.
const REVENUECAT_IOS_API_KEY = "appl_cNDWqBtJHphXCNvOkhEtxSvxHSG";
const SUBSCRIPTION_CACHE_KEY = "jozu:subscription:v1";

export type PlusPlanId = "monthly" | "yearly";

export type PlusPlan = {
  id: PlusPlanId;
  title: string;
  productIdentifier: string;
  priceLabel: string;
  periodLabel: string;
  isBestValue?: boolean;
  packageToPurchase?: PurchasesPackage;
  storeProduct?: PurchasesStoreProduct;
};

export type SubscriptionStatus = {
  configured: boolean;
  hasActiveSubscription: boolean;
  legacyPlus: boolean;
  canAccessPlus: boolean;
  monthlyPlan: PlusPlan;
  yearlyPlan: PlusPlan;
  error: string | null;
  updatedAt: number;
};

export type PurchaseResult =
  | { status: "success"; subscriptionStatus: SubscriptionStatus }
  | { status: "cancelled"; message: string }
  | { status: "pending"; message: string }
  | { status: "error"; message: string };

export type PremiumFeature =
  | "unlimitedPractice"
  | "reviewPractice"
  | "practiceCategories"
  | "audioMode"
  | "advancedJlptPacks"
  | "advancedStats"
  | "customThemes"
  | "streakFreeze";

const defaultMonthlyPlan: PlusPlan = {
  id: "monthly",
  title: "Monthly",
  productIdentifier: JOZU_PLUS_MONTHLY_ID,
  priceLabel: "$2.99",
  periodLabel: "per month"
};

const defaultYearlyPlan: PlusPlan = {
  id: "yearly",
  title: "Yearly",
  productIdentifier: JOZU_PLUS_YEARLY_ID,
  priceLabel: "$9.99",
  periodLabel: "per year",
  isBestValue: true
};

let configuredUserId: string | null = null;

function baseStatus(legacyPlus = false): SubscriptionStatus {
  return {
    configured: false,
    hasActiveSubscription: false,
    legacyPlus,
    canAccessPlus: legacyPlus,
    monthlyPlan: defaultMonthlyPlan,
    yearlyPlan: defaultYearlyPlan,
    error: REVENUECAT_IOS_API_KEY ? null : "RevenueCat API key is not configured yet.",
    updatedAt: Date.now()
  };
}

function getPurchasesErrorMessage(error: unknown): string {
  const purchasesError = error as Partial<PurchasesError>;

  if (purchasesError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
    return "Purchase is pending approval.";
  }

  if (purchasesError.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
    return "This subscription is not available yet. Check App Store Connect and RevenueCat setup.";
  }

  if (
    purchasesError.code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
    purchasesError.code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
  ) {
    return "Network issue. Check your connection and try again.";
  }

  if (typeof purchasesError.message === "string") {
    return purchasesError.message;
  }

  return "Something went wrong with the App Store purchase.";
}

function isPurchaseCancelled(error: unknown): boolean {
  const purchasesError = error as Partial<PurchasesError>;
  return (
    purchasesError.userCancelled === true ||
    purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

function hasJozuPlus(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) {
    return false;
  }

  return Boolean(
    customerInfo.entitlements.active[JOZU_PLUS_ENTITLEMENT_ID] ||
      customerInfo.activeSubscriptions.includes(JOZU_PLUS_MONTHLY_ID) ||
      customerInfo.activeSubscriptions.includes(JOZU_PLUS_YEARLY_ID)
  );
}

function planFromPackage(id: PlusPlanId, fallback: PlusPlan, purchasesPackage: PurchasesPackage | null) {
  if (!purchasesPackage) {
    return fallback;
  }

  return {
    ...fallback,
    productIdentifier: purchasesPackage.product.identifier,
    priceLabel: purchasesPackage.product.priceString || fallback.priceLabel,
    packageToPurchase: purchasesPackage
  };
}

function planFromProduct(id: PlusPlanId, fallback: PlusPlan, product: PurchasesStoreProduct | null) {
  if (!product) {
    return fallback;
  }

  return {
    ...fallback,
    productIdentifier: product.identifier,
    priceLabel: product.priceString || fallback.priceLabel,
    storeProduct: product
  };
}

async function cacheStatus(status: SubscriptionStatus) {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(status));
  } catch {
    // Cache is convenience only. Subscription state is still restored from RevenueCat.
  }
}

export async function getCachedSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const rawValue = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    return rawValue ? (JSON.parse(rawValue) as SubscriptionStatus) : null;
  } catch {
    return null;
  }
}

export function isRevenueCatConfigured(): boolean {
  return Platform.OS === "ios" && REVENUECAT_IOS_API_KEY.length > 0;
}

export function canAccessFeature(
  subscriptionStatus: SubscriptionStatus | null,
  feature: PremiumFeature
): boolean {
  const hasPlus = subscriptionStatus?.canAccessPlus === true;

  switch (feature) {
    case "unlimitedPractice":
    case "reviewPractice":
    case "practiceCategories":
      return hasPlus;
    case "audioMode":
    case "advancedJlptPacks":
    case "advancedStats":
    case "customThemes":
    case "streakFreeze":
      return false;
    default:
      return false;
  }
}

export async function configureSubscriptions(uid: string | null) {
  if (!isRevenueCatConfigured() || !uid || configuredUserId === uid) {
    return;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: REVENUECAT_IOS_API_KEY,
    appUserID: uid
  });
  configuredUserId = uid;
}

export async function getSubscriptionStatus(
  uid: string | null,
  legacyPlus: boolean
): Promise<SubscriptionStatus> {
  const fallbackStatus = baseStatus(legacyPlus);

  if (!isRevenueCatConfigured() || !uid) {
    await cacheStatus(fallbackStatus);
    return fallbackStatus;
  }

  try {
    await configureSubscriptions(uid);
    const [customerInfo, offerings] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings().catch(() => null)
    ]);
    const products = await Purchases.getProducts([JOZU_PLUS_MONTHLY_ID, JOZU_PLUS_YEARLY_ID]).catch(
      () => []
    );
    const monthlyProduct =
      products.find((product) => product.identifier === JOZU_PLUS_MONTHLY_ID) ?? null;
    const yearlyProduct =
      products.find((product) => product.identifier === JOZU_PLUS_YEARLY_ID) ?? null;
    const currentOffering = offerings?.current ?? null;
    const hasActiveSubscription = hasJozuPlus(customerInfo);

    const status: SubscriptionStatus = {
      configured: true,
      hasActiveSubscription,
      legacyPlus,
      canAccessPlus: hasActiveSubscription || legacyPlus,
      monthlyPlan: planFromProduct(
        "monthly",
        planFromPackage("monthly", defaultMonthlyPlan, currentOffering?.monthly ?? null),
        monthlyProduct
      ),
      yearlyPlan: planFromProduct(
        "yearly",
        planFromPackage("yearly", defaultYearlyPlan, currentOffering?.annual ?? null),
        yearlyProduct
      ),
      error: null,
      updatedAt: Date.now()
    };

    await cacheStatus(status);
    return status;
  } catch (error) {
    console.warn("Subscription status load failed.", error);
    return {
      ...fallbackStatus,
      error: getPurchasesErrorMessage(error)
    };
  }
}

export async function purchasePlusPlan(
  plan: PlusPlan,
  uid: string | null,
  legacyPlus: boolean
): Promise<PurchaseResult> {
  if (!isRevenueCatConfigured() || !uid) {
    return {
      status: "error",
      message: "Subscriptions are not configured yet."
    };
  }

  try {
    await configureSubscriptions(uid);
    const purchaseResult = plan.packageToPurchase
      ? await Purchases.purchasePackage(plan.packageToPurchase)
      : plan.storeProduct
        ? await Purchases.purchaseStoreProduct(plan.storeProduct)
        : await Purchases.purchaseProduct(plan.productIdentifier);
    const subscriptionStatus = await getSubscriptionStatus(uid, legacyPlus);

    if (hasJozuPlus(purchaseResult.customerInfo) || subscriptionStatus.canAccessPlus) {
      return { status: "success", subscriptionStatus };
    }

    return {
      status: "pending",
      message: "Purchase completed, but Plus access is still syncing."
    };
  } catch (error) {
    if (isPurchaseCancelled(error)) {
      return { status: "cancelled", message: "Purchase cancelled." };
    }

    if ((error as Partial<PurchasesError>).code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return { status: "pending", message: "Purchase is pending approval." };
    }

    return { status: "error", message: getPurchasesErrorMessage(error) };
  }
}

export async function restorePlusPurchases(
  uid: string | null,
  legacyPlus: boolean
): Promise<PurchaseResult> {
  if (!isRevenueCatConfigured() || !uid) {
    return {
      status: "error",
      message: "Subscriptions are not configured yet."
    };
  }

  try {
    await configureSubscriptions(uid);
    const customerInfo = await Purchases.restorePurchases();
    const subscriptionStatus = await getSubscriptionStatus(uid, legacyPlus);

    if (hasJozuPlus(customerInfo) || subscriptionStatus.canAccessPlus) {
      return { status: "success", subscriptionStatus };
    }

    return {
      status: "error",
      message: "No active Jozu Plus purchase was found."
    };
  } catch (error) {
    return { status: "error", message: getPurchasesErrorMessage(error) };
  }
}
