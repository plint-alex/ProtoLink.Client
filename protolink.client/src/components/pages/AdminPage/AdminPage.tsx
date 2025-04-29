import React from 'react';
import { Box, Grid } from '@mui/material';
import Entities from './Entities';
import Entity from './Entity';

const AdminPage: React.FC = () => {
    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Entity />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Entities />
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminPage; 