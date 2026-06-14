import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Shimmer animation for loading states
function ShimmerEffect({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.shimmerContainer, { width: width as any, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.shimmerGradient,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

// Post Card Skeleton
export function PostCardSkeleton() {
  return (
    <View style={styles.postCard}>
      <ShimmerEffect width="70%" height={18} />
      <View style={{ height: 8 }} />
      <ShimmerEffect width="100%" height={14} />
      <View style={{ height: 4 }} />
      <ShimmerEffect width="85%" height={14} />
      <View style={{ height: 12 }} />
      <View style={styles.row}>
        <ShimmerEffect width={60} height={24} borderRadius={12} />
        <View style={{ width: 8 }} />
        <ShimmerEffect width={80} height={24} borderRadius={12} />
        <View style={{ flex: 1 }} />
        <ShimmerEffect width={40} height={14} />
      </View>
    </View>
  );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <View style={styles.statsRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statCard}>
          <ShimmerEffect width={40} height={28} />
          <View style={{ height: 6 }} />
          <ShimmerEffect width={60} height={12} />
        </View>
      ))}
    </View>
  );
}

// Editor Skeleton
export function EditorSkeleton() {
  return (
    <View style={styles.editorContainer}>
      <ShimmerEffect width="60%" height={24} />
      <View style={{ height: 16 }} />
      <ShimmerEffect width="100%" height={16} />
      <View style={{ height: 8 }} />
      <ShimmerEffect width="90%" height={16} />
      <View style={{ height: 8 }} />
      <ShimmerEffect width="95%" height={16} />
      <View style={{ height: 8 }} />
      <ShimmerEffect width="70%" height={16} />
      <View style={{ height: 16 }} />
      <ShimmerEffect width="100%" height={16} />
      <View style={{ height: 8 }} />
      <ShimmerEffect width="85%" height={16} />
      <View style={{ height: 8 }} />
      <ShimmerEffect width="92%" height={16} />
    </View>
  );
}

// Asset Grid Skeleton
export function AssetGridSkeleton() {
  return (
    <View style={styles.assetGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.assetItem}>
          <ShimmerEffect width="100%" height={100} borderRadius={8} />
          <View style={{ height: 6 }} />
          <ShimmerEffect width="80%" height={12} />
        </View>
      ))}
    </View>
  );
}

// List Item Skeleton
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <ShimmerEffect width={40} height={40} borderRadius={20} />
          <View style={styles.listItemContent}>
            <ShimmerEffect width="65%" height={14} />
            <View style={{ height: 6 }} />
            <ShimmerEffect width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Full Page Loading Skeleton
export function FullPageSkeleton() {
  return (
    <View style={styles.fullPage}>
      <ShimmerEffect width="50%" height={24} />
      <View style={{ height: 24 }} />
      <DashboardStatsSkeleton />
      <View style={{ height: 24 }} />
      <PostCardSkeleton />
      <View style={{ height: 12 }} />
      <PostCardSkeleton />
      <View style={{ height: 12 }} />
      <PostCardSkeleton />
    </View>
  );
}

// Pull to Refresh Indicator
export function PullToRefreshIndicator({ pulling }: { pulling: boolean }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pulling) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [pulling]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!pulling) return null;

  return (
    <View style={styles.refreshContainer}>
      <Animated.Text style={[styles.refreshIcon, { transform: [{ rotate }] }]}>
        ⟳
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: 200,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    position: 'absolute',
  },
  postCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editorContainer: {
    padding: 16,
  },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  assetItem: {
    width: '31%',
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  fullPage: {
    padding: 16,
  },
  refreshContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  refreshIcon: {
    fontSize: 24,
    color: '#3b82f6',
  },
});
