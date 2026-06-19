import { Animated, Easing } from "react-native";

// Custom easing curves for a polished native feel
export const EASINGS = {
  // Snappy ease-out for entering UI elements
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  // Smooth ease-in-out for morphing/moving
  easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
  // Bouncy spring-like feel
  spring: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  // Gentle deceleration
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  // Quick acceleration
  accelerate: Easing.bezier(0.4, 0, 1, 1),
};

// Standard durations
export const DURATIONS = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  entrance: 300,
  exit: 200,
};

// Fade In animation
export function fadeIn(
  animatedValue: Animated.Value,
  duration = DURATIONS.normal,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Fade Out animation
export function fadeOut(
  animatedValue: Animated.Value,
  duration = DURATIONS.exit,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Slide In from bottom
export function slideInUp(
  animatedValue: Animated.Value,
  duration = DURATIONS.entrance,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Slide Out to bottom
export function slideOutDown(
  animatedValue: Animated.Value,
  distance = 100,
  duration = DURATIONS.exit,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: distance,
    duration,
    delay,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Scale In (from 0.95 to 1 - never from 0!)
export function scaleIn(
  animatedValue: Animated.Value,
  duration = DURATIONS.normal,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Scale Out
export function scaleOut(
  animatedValue: Animated.Value,
  duration = DURATIONS.exit,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 0.95,
    duration,
    delay,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Spring animation for bouncy effects
export function springBounce(
  animatedValue: Animated.Value,
  toValue = 1,
  friction = 7,
  tension = 40
): Animated.CompositeAnimation {
  return Animated.spring(animatedValue, {
    toValue,
    friction,
    tension,
    useNativeDriver: true,
  });
}

// Button press animation (scale down to 0.97)
export function buttonPress(
  animatedValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.timing(animatedValue, {
    toValue: 0.97,
    duration: DURATIONS.instant,
    easing: EASINGS.easeOut,
    useNativeDriver: true,
  });
}

// Button release animation
export function buttonRelease(
  animatedValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 5,
    tension: 100,
    useNativeDriver: true,
  });
}

// Stagger animation for list items
export function staggeredEntrance(
  animatedValues: Animated.Value[],
  staggerDelay = 50,
  duration = DURATIONS.normal
): Animated.CompositeAnimation {
  return Animated.stagger(
    staggerDelay,
    animatedValues.map(value =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: EASINGS.easeOut,
        useNativeDriver: true,
      })
    )
  );
}

// Shake animation for error feedback
export function shake(
  animatedValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 6,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -6,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ]);
}

// Pulse animation for attention
export function pulse(
  animatedValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.05,
        duration: 800,
        easing: EASINGS.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 800,
        easing: EASINGS.easeInOut,
        useNativeDriver: true,
      }),
    ])
  );
}

// Shimmer effect for loading states
export function shimmer(
  animatedValue: Animated.Value
): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
}

// Combined entrance animation (fade + slide + scale)
export function entranceAnimation(
  opacity: Animated.Value,
  translateY: Animated.Value,
  scale: Animated.Value,
  delay = 0
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: DURATIONS.entrance,
      delay,
      easing: EASINGS.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(translateY, {
      toValue: 0,
      duration: DURATIONS.entrance,
      delay,
      easing: EASINGS.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 1,
      duration: DURATIONS.entrance,
      delay,
      easing: EASINGS.easeOut,
      useNativeDriver: true,
    }),
  ]);
}
