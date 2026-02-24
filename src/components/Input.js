import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { theme } from '../styles/theme';
import { Typography } from './Typography';

export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Typography variant="bodyMd" color="neutral.900" style={styles.label}>
          {label}
        </Typography>
      )}
      
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.neutral[700]}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && (
        <Typography variant="caption" color="error.500" style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[4],
  },
  label: {
    marginBottom: theme.spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.radius.md,
    height: 56,
    paddingHorizontal: theme.spacing[4],
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error[500],
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.neutral[900],
    height: '100%',
  },
  leftIcon: {
    marginRight: theme.spacing[2],
  },
  rightIcon: {
    marginLeft: theme.spacing[2],
  },
  errorText: {
    marginTop: theme.spacing[1],
  },
});
