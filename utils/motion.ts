import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing } from "react-native";

export const MOTION = {
  quick: 110,
  base: 180,
  modal: 220,
  reveal: 320,
  stagger: 85,
  pressScale: 0.94,
  popScale: 1.08,
  waveLift: -8,
  easing: Easing.out(Easing.cubic)
};

export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
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
