import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../styles/theme';

export const StatusBadge = ({ status, style }) => {
    const getStatusConfig = (s) => {
        switch (s?.toLowerCase()) {
            case 'waiting':
                return { label: 'Waiting', color: '#F59E0B', bgColor: '#FEF3C7' };
            case 'in_consultation':
                return { label: 'In Consultation', color: '#3B82F6', bgColor: '#DBEAFE' };
            case 'completed':
                return { label: 'Completed', color: '#10B981', bgColor: '#D1FAE5' };
            case 'no_show':
                return { label: 'No Show', color: '#EF4444', bgColor: '#FEE2E2' };
            default:
                return { label: s || 'Unknown', color: '#6B7280', bgColor: '#F3F4FB' };
        }
    };

    const config = getStatusConfig(status);

    return (
        <View style={[styles.badge, { backgroundColor: config.bgColor }, style]}>
            <Typography variant="caption" style={{ color: config.color, fontWeight: '700' }}>
                {config.label}
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
});
