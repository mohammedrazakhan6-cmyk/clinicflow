import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../styles/theme';

export const StatusPill = ({ status, style }) => {
  let bgColor, textColor, label;

  switch (status?.toLowerCase()) {
    case 'completed':
      bgColor = '#EAF8EF';
      textColor = '#1A7A4C';
      label = 'Completed';
      break;
    case 'cancelled':
    case 'no_show':
      bgColor = '#FDEDED';
      textColor = '#C72A2A';
      label = status?.toLowerCase() === 'no_show' ? 'No Show' : 'Cancelled';
      break;
    case 'waiting':
      bgColor = '#FEF6E1';
      textColor = '#C67100';
      label = 'Waiting';
      break;
    case 'in_consultation':
      bgColor = '#FEF6E1';
      textColor = '#C67100';
      label = 'Consulting';
      break;
    default:
      bgColor = theme.colors.neutral[100];
      textColor = theme.colors.neutral[700];
      label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
      break;
  }

  return (
    <View style={[styles.pill, { backgroundColor: bgColor }, style]}>
      <Typography variant="caption" style={{ color: textColor, fontWeight: '700' }}>
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
