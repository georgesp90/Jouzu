import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing } from "react-native";

export const MOTION = {
  quick: 90,
  base: 170,
  reveal: 240,
  modal: 190,
  stagger: 58,
  popScale: 1.06,
  pressScale: 0.95,
  waveLift: -4,
  easing: Easing.out(Easing.cubic)
};

export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(Boolean(enabled));
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}
