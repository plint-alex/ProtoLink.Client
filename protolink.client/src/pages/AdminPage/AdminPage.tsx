import React from 'react';
import { Box, Grid } from '@mui/material';
import Entities from './Entities';
import Entity from './Entity';

const AdminPage: React.FC = () => {
    return (
        <>
            <Entity />
            <Entities />
        </>
    );
};

export default AdminPage; 