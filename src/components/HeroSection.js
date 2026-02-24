import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Typography } from './Typography';
import { theme } from '../styles/theme';
import { ChevronLeft, Phone, MessageSquare, Clock, Heart, LogOut } from 'lucide-react-native';
import { Images } from '../../assets/onboarding/doctorprofile.png';


const { width } = Dimensions.get('window');

export const HeroSection = ({
    doctorName,
    specialty,
    experience,
    patientsServed,
    navigation,
    onLogout,
}) => {
    const canGoBack = navigation?.canGoBack?.();

    return (
        <View style={styles.container}>
            {/* Top Navigation */}
            <View style={styles.topNav}>
                {canGoBack ? (
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={22} color={theme.colors.neutral[900]} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
                        <LogOut size={22} color={theme.colors.error[500]} />
                    </TouchableOpacity>
                )}

                {/* <View style={styles.rightNavIcons}>
                    <TouchableOpacity style={styles.iconButtonSmall}>
                        <Phone size={18} color={theme.colors.neutral[900]} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonSmall}>
                        <MessageSquare size={18} color={theme.colors.neutral[900]} />
                    </TouchableOpacity>
                </View> */}
            </View>

            {/* Hero Card */}
            <View style={styles.heroCard}>
                {/* LEFT */}
                <View style={styles.leftContent}>
                    <View style={styles.badge}>
                        <Typography variant="caption" color="neutral.500">
                            ID: D-0269784
                        </Typography>
                    </View>

                    <Typography style={styles.doctorName}>{doctorName}</Typography>

                    <Typography variant="bodyMd" color="neutral.500" style={{ marginBottom: 16 }}>
                        {specialty}
                    </Typography>

                    {/* Credibility Row */}
                    <View style={styles.credibilityRow}>
                        <View style={styles.statBadge}>
                            <Clock size={14} color={theme.colors.neutral[700]} />
                            <Typography variant="caption" color="neutral.800" style={styles.statText}>
                                {experience}+ Years
                            </Typography>
                        </View>

                        <View style={styles.statBadge}>
                            <Heart
                                size={14}
                                color={theme.colors.accent[500]}
                                fill={theme.colors.accent[500]}
                            />
                            <Typography variant="caption" color="neutral.800" style={styles.statText}>
                                {patientsServed} + Patients
                            </Typography>
                        </View>
                    </View>
                </View>

                {/* RIGHT IMAGE */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/onboarding/doctorprofile.png')}
                        style={styles.doctorImage}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 24,
    },

    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },

    rightNavIcons: {
        flexDirection: 'row',
        gap: 12,
    },

    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: theme.colors.neutral[0],
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadow.card,
    },

    iconButtonSmall: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: theme.colors.neutral[0],
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadow.card,
    },

    heroCard: {
        backgroundColor: theme.colors.neutral[0],
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        minHeight: 220,
        ...theme.shadow.card,
    },

    leftContent: {
        flex: 1,
        justifyContent: 'space-between',
    },

    badge: {
        backgroundColor: '#EEF0F3',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },

    doctorName: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.neutral[900],
        marginBottom: 6,
    },

    credibilityRow: {
        flexDirection: 'row',
        gap: 50,
    },

    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F3F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 10,
    },

    statText: {
        fontWeight: '600',
    },

    imageContainer: {
        width: width * 0.42,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },

    doctorImage: {
        width: '100%',
        height: 230,
    },
});