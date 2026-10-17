import React, { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export type EntityStateAction = {
    label: string;
    to: string;
};

type EntityStateProps = {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action: EntityStateAction;
    detailsLabel: string;
    details?: string;
};

/** UX Pattern 5 state: plain wording + one primary action; raw detail only behind a Details toggle. */
const EntityState: React.FC<EntityStateProps> = ({ icon, title, subtitle, action, detailsLabel, details }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <Stack spacing={1.5} alignItems="center" sx={{ py: 8, px: 2, textAlign: 'center' }}>
            <Box sx={{ color: 'text.secondary', '& svg': { fontSize: 56 } }}>{icon}</Box>
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
            <Button variant="contained" component={RouterLink} to={action.to} sx={{ textTransform: 'none' }}>
                {action.label}
            </Button>
            {details && (
                <>
                    <Button size="small" color="inherit" onClick={() => setShowDetails((v) => !v)} sx={{ textTransform: 'none' }}>
                        {detailsLabel}
                    </Button>
                    {showDetails && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            component="pre"
                            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}
                        >
                            {details}
                        </Typography>
                    )}
                </>
            )}
        </Stack>
    );
};

export default EntityState;
