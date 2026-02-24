import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../styles/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, text
  size = 'md', // md, lg
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isText = variant === 'text';

  const getContainerStyle = () => {
    let base = {};
    if (size === 'md') base = { height: 48, paddingHorizontal: theme.spacing[4] };
    if (size === 'lg') base = { height: 56, paddingHorizontal: theme.spacing[5] };

    if (isPrimary) {
      base = { ...base, backgroundColor: '#347b8d' }; // Matching onboarding button color
    } else if (isSecondary) {
      base = {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
      };
    } else if (isText) {
      base = { ...base, backgroundColor: 'transparent' };
    }

    if (disabled) {
      base = { ...base, opacity: 0.5 };
    }

    return base;
  };

  const getTextColor = () => {
    if (isPrimary) return 'neutral.0';
    if (isSecondary || isText) return 'primary.500';
    return 'neutral.900';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, getContainerStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#347b8d'} />
      ) : (
        <Typography variant="bodyLg" color={getTextColor()} style={[{ fontWeight: '500' }, textStyle]}>
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 28, // Round pill shape like onboarding
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});
