import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const Typography = ({ 
  variant = 'bodyLg', 
  color = 'neutral.900', 
  align = 'left', 
  style, 
  children, 
  ...props 
}) => {
  const getStyleForVariant = (v) => theme.typography[v] || theme.typography.bodyLg;
  const getColor = (c) => {
    const [category, shade] = c.split('.');
    return shade ? theme.colors[category][shade] : theme.colors[category] || theme.colors.neutral[900];
  };

  const textStyle = {
    ...getStyleForVariant(variant),
    color: getColor(color),
    textAlign: align,
  };

  return (
    <Text style={[styles.base, textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.typography.fontFamily,
  },
});
