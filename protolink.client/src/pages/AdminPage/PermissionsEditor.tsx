import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/store';
import { getPermissions, addPermissionNew, removePermission } from '../../store/actions/thunkActions/entities';
import { Grid, TextField, Typography, IconButton, Tooltip, Chip, Stack, Switch, FormControlLabel, Badge } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import type { Permission } from '../../types/entities';
import { Dictionary } from '../../types/dictionary';
import { Snackbar, Alert } from '@mui/material';

const StyledChip = styled(Chip)(({ theme }) => ({
    margin: theme.spacing(0.5),
}));

interface PermissionsEditorProps {
    entityId: string;
    entities: Dictionary<any>;
}

const PermissionsEditor: React.FC<PermissionsEditorProps> = ({ entityId, entities }) => {
    const dispatch = useAppDispatch();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false);
    const [permissionForIdToAdd, setPermissionForIdToAdd] = useState('');
    const [canWrite, setCanWrite] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (entityId) {
            loadPermissions();
        }
    }, [entityId]);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const result = await dispatch(getPermissions({ entityId }));
            if (getPermissions.fulfilled.match(result)) {
                setPermissions(result.payload);
            }
        } catch (error) {
            showSnackbar('Failed to load permissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddPermission = async () => {
        if (!permissionForIdToAdd.trim()) {
            showSnackbar('Please enter a PermissionForId', 'error');
            return;
        }

        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(permissionForIdToAdd.trim())) {
            showSnackbar('Invalid GUID format', 'error');
            return;
        }

        // Check for duplicate
        if (permissions.some(p => p.permissionForId === permissionForIdToAdd.trim())) {
            showSnackbar('Permission already exists for this entity', 'error');
            return;
        }

        try {
            await dispatch(addPermissionNew({
                id: entityId,
                permissionForId: permissionForIdToAdd.trim(),
                canWrite: canWrite
            })).unwrap();
            
            showSnackbar('Permission added successfully', 'success');
            setPermissionForIdToAdd('');
            setCanWrite(false);
            loadPermissions();
        } catch (error: any) {
            showSnackbar(error?.message || 'Failed to add permission', 'error');
        }
    };

    const handleRemovePermission = async (permissionForId: string) => {
        try {
            await dispatch(removePermission({
                entityId: entityId,
                permissionForId: permissionForId
            })).unwrap();
            
            showSnackbar('Permission removed successfully', 'success');
            loadPermissions();
        } catch (error: any) {
            showSnackbar(error?.message || 'Failed to remove permission', 'error');
        }
    };

    const getPermissionLabel = (permission: Permission): string => {
        const code = permission.permissionForCode || (entities && entities[permission.permissionForId]?.code);
        if (code) {
            return `${code} (${permission.permissionForId})`;
        }
        return permission.permissionForId;
    };

    return (
        <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Permissions
            </Typography>
            {loading ? (
                <Typography>Loading permissions...</Typography>
            ) : (
                <>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        {permissions.map((permission) => (
                            <Badge
                                key={permission.id}
                                badgeContent={permission.isUser ? 'User' : 'Group'}
                                color={permission.isUser ? 'primary' : 'secondary'}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <StyledChip
                                    label={`${getPermissionLabel(permission)} - ${permission.canWrite ? 'Write' : 'Read'}`}
                                    onDelete={() => handleRemovePermission(permission.permissionForId)}
                                    color={permission.canWrite ? 'primary' : 'default'}
                                    variant="outlined"
                                    size="small"
                                />
                            </Badge>
                        ))}
                    </Stack>
                    <Grid container spacing={0} alignItems="center">
                        <Grid item xs={8} sm={8}>
                            <TextField
                                fullWidth
                                label="PermissionForId (GUID)"
                                margin="none"
                                placeholder="Enter user or group entity ID"
                                value={permissionForIdToAdd}
                                onChange={e => setPermissionForIdToAdd(e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={2} sm={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={canWrite}
                                        onChange={e => setCanWrite(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Write"
                                labelPlacement="top"
                            />
                        </Grid>
                        <Grid item xs={2} sm={2}>
                            <Tooltip title="Add permission">
                                <IconButton
                                    size="small"
                                    aria-label="AddPermission"
                                    onClick={handleAddPermission}
                                    color="primary"
                                    disabled={!permissionForIdToAdd.trim()}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </>
            )}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default PermissionsEditor;

