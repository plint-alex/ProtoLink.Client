import React, { useState, useRef } from 'react';
import { Box, Typography, Menu, MenuItem, Avatar, Divider } from '@mui/material';
import { useNavigationWithParams } from '../../hooks/useNavigationWithParams';

interface UserMenuProps {
    userName?: string;
    login?: string;
    onLogout: () => void;
    text: {
        login: string;
        logout: string;
        userDefault: string;
    };
}

const getInitials = (name?: string, login?: string, fallback?: string): string => {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (login) {
        return login.substring(0, 2).toUpperCase();
    }
    if (fallback) {
        return fallback.substring(0, 2).toUpperCase();
    }
    return '?';
};

const getAvatarColor = (text: string): string => {
    const colors = [
        '#795548', // Brown
        '#5C6BC0', // Indigo
        '#42A5F5', // Blue
        '#26A69A', // Teal
        '#66BB6A', // Green
        '#FFA726', // Orange
        '#EF5350', // Red
        '#AB47BC', // Purple
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const UserMenu: React.FC<UserMenuProps> = ({ userName, login, onLogout, text }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);
    const navigateWithParams = useNavigationWithParams();
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogin = () => {
        handleClose();
        // Clean URL parameters when navigating to login
        navigateWithParams('/login', {
            params: { logout: null, returnurl: null },
            replace: true
        });
    };

    const handleLogout = () => {
        handleClose();
        onLogout();
    };

    const initials = getInitials(userName, login, text.userDefault);
    const avatarColor = getAvatarColor(userName || login || text.userDefault || 'x');
    const displayName = userName || text.userDefault;
    const displayEmail = login || '';

    return (
        <>
            <Box
                ref={avatarRef}
                onClick={handleClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    padding: '4px',
                    '&:hover': {
                        backgroundColor: 'rgba(60, 64, 67, 0.08)',
                    },
                }}
            >
                <Avatar
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: avatarColor,
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    {initials}
                </Avatar>
            </Box>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 280,
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px 0 rgba(0,0,0,0.2)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        '& .MuiMenuItem-root': {
                            px: 2,
                            py: 1.5,
                            fontSize: '14px',
                            color: '#202124',
                            '&:hover': {
                                backgroundColor: 'rgba(60, 64, 67, 0.08)',
                            },
                        },
                    },
                }}
            >
                {userName && (
                    <>
                        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 64,
                                    height: 64,
                                    bgcolor: avatarColor,
                                    color: '#FFFFFF',
                                    fontSize: '24px',
                                    fontWeight: 500,
                                    mb: 1,
                                }}
                            >
                                {initials}
                            </Avatar>
                            <Typography
                                sx={{
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    color: '#202124',
                                    mb: 0.5,
                                }}
                            >
                                {displayName}
                            </Typography>
                            {displayEmail && (
                                <Typography
                                    sx={{
                                        fontSize: '14px',
                                        color: '#5F6368',
                                    }}
                                >
                                    {displayEmail}
                                </Typography>
                            )}
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                    </>
                )}
                {userName ? (
                    <MenuItem onClick={handleLogout}>
                        <Typography sx={{ fontSize: '14px', color: '#202124' }}>{text.logout}</Typography>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={handleLogin}>
                        <Typography sx={{ fontSize: '14px', color: '#202124' }}>{text.login}</Typography>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

