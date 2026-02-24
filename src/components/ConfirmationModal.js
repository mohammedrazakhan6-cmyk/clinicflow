import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../styles/theme';

export const ConfirmationModal = ({ visible, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", destructrive = false }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <Typography variant="h3" color="neutral.900" style={styles.title}>{title}</Typography>
                    <Typography variant="bodyMd" color="neutral.500" style={styles.message}>{message}</Typography>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                        >
                            <Typography variant="button" color="neutral.700">{cancelText}</Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                destructrive ? styles.confirmButtonDestructive : styles.confirmButton
                            ]}
                            onPress={onConfirm}
                        >
                            <Typography variant="button" color="neutral.0">{confirmText}</Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        backgroundColor: theme.colors.neutral[0],
        width: '100%',
        borderRadius: 24,
        padding: 24,
        ...theme.shadow.modal,
    },
    title: {
        marginBottom: 8,
    },
    message: {
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.neutral[100],
    },
    confirmButton: {
        backgroundColor: theme.colors.primary[500],
    },
    confirmButtonDestructive: {
        backgroundColor: theme.colors.error[500],
    },
});
