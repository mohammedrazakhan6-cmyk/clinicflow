import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const Card = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.neutral[0],
    borderRadius: theme.radius.lg,
    padding: theme.spacing[5],
    ...theme.shadow.card,
  },
});
