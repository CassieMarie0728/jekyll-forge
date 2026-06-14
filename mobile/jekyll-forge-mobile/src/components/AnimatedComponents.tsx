import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {
  fadeIn,
  scaleIn,
  slideInUp,
  buttonPress,
  buttonRelease,
  entranceAnimation,
  shimmer,
  DURATIONS,
} from '../utils/animations';

// Animated Pressable Button with scale feedback
interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function AnimatedButton({ onPress, children, style, disabled }: AnimatedButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    buttonPress(scaleValue).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    buttonRelease(scaleValue).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale: scaleValue }], opacity: disabled ? 0.5 : 1 },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// Fade In wrapper
interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({ children, delay = 0, duration = DURATIONS.normal, style }: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn(opacity, duration, delay).start();
  }, []);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

// Scale In wrapper
interface ScaleInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScaleInView({ children, delay = 0, duration = DURATIONS.normal, style }: ScaleInViewProps) {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      scaleIn(scale, duration, delay),
      fadeIn(opacity, duration, delay),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
      {children}
    </Animated.View>
  );
}

// Slide In from bottom wrapper
interface SlideInViewProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function SlideInView({ children, delay = 0, distance = 30, style }: SlideInViewProps) {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      slideInUp(translateY, DURATIONS.entrance, delay),
      fadeIn(opacity, DURATIONS.entrance, delay),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
}

// Staggered list item
interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggerItem({ children, index, staggerDelay = 50, style }: StaggerItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const delay = index * staggerDelay;
    entranceAnimation(opacity, translateY, scale, delay).start();
  }, []);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}

// Skeleton loading placeholder with shimmer
interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    shimmer(shimmerValue).start();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#1e293b',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX }],
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          width: 100,
        }}
      />
    </View>
  );
}

// Loading skeleton for cards
export function CardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={skeletonStyles.cardHeaderText}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="100%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
      <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
    </View>
  );
}

// Loading skeleton for list items
export function ListItemSkeleton() {
  return (
    <View style={skeletonStyles.listItem}>
      <Skeleton width={48} height={48} borderRadius={8} />
      <View style={skeletonStyles.listItemContent}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

// Empty state component
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <FadeInView style={emptyStyles.container}>
      <ScaleInView delay={100}>
        <View style={emptyStyles.iconContainer}>
          <Animated.Text style={emptyStyles.icon}>{icon}</Animated.Text>
        </View>
      </ScaleInView>
      <SlideInView delay={200}>
        <View style={emptyStyles.textContainer}>
          <Animated.Text style={emptyStyles.title}>{title}</Animated.Text>
          <Animated.Text style={emptyStyles.description}>{description}</Animated.Text>
        </View>
      </SlideInView>
      {actionLabel && onAction && (
        <SlideInView delay={300}>
          <AnimatedButton onPress={onAction} style={emptyStyles.actionButton}>
            <View style={emptyStyles.actionButtonInner}>
              <Animated.Text style={emptyStyles.actionButtonText}>{actionLabel}</Animated.Text>
            </View>
          </AnimatedButton>
        </SlideInView>
      )}
    </FadeInView>
  );
}

// Pull to refresh indicator
interface PullToRefreshProps {
  refreshing: boolean;
}

export function PullToRefreshIndicator({ refreshing }: PullToRefreshProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [refreshing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!refreshing) return null;

  return (
    <View style={refreshStyles.container}>
      <Animated.Text style={[refreshStyles.spinner, { transform: [{ rotate: spin }] }]}>
        ⟳
      </Animated.Text>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    marginLeft: 12,
    flex: 1,
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 20,
  },
  actionButtonInner: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

const refreshStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  spinner: {
    fontSize: 24,
    color: '#3b82f6',
  },
});
