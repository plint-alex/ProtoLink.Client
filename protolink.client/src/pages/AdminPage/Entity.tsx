import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector, selectEntity } from '../../store/store';
import { useParams } from 'react-router-dom';
import { getEntity, updateEntity } from '../../store/actions/thunkActions/entities';
import { Button, Grid, Paper, TextField, Typography, IconButton, Tooltip, Card, CardContent, Dialog, DialogTitle as MuiDialogTitle, Chip, Stack, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import Editor from './Editor';
import File from './File';
import type { EntityValue } from '../../types/entities';
import { useFormik } from 'formik';
import { Dictionary } from '../../types/dictionary';
import { useSelector } from 'react-redux';

const StyledPaper = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'left',
    padding: theme.spacing(2, 4, 3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
    marginTop: theme.spacing(1),
}));

const DialogTitleStyled = styled(MuiDialogTitle)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

interface ParentsEditorProps {
    parents: string[];
    onAddParent: (parentId: string) => void;
    onRemoveParent: (index: number) => void;
    entities: Dictionary<any>;
}

const ParentsEditor: React.FC<ParentsEditorProps> = ({ parents, onAddParent, onRemoveParent, entities }) => {
    const [parentIdToAdd, setParentIdToAdd] = useState('');
    return (
        <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {parents.map((parentId, idx) => (
                    <Chip
                        key={parentId + idx}
                        label={entities && entities[parentId] ? `${entities[parentId].code} (${parentId})` : parentId}
                        onDelete={() => onRemoveParent(idx)}
                        size="small"
                        color="default"
                        variant="outlined"
                    />
                ))}
            </Stack>
            <Grid container spacing={0} alignItems="center">
                <Grid item xs={10} sm={10}>
                    <TextField
                        fullWidth
                        label="Add parent ID"
                        margin="none"
                        placeholder="Enter parent entity id"
                        value={parentIdToAdd}
                        onChange={e => setParentIdToAdd(e.target.value)}
                    />
                </Grid>
                <Grid item xs={2} sm={2}>
                    <Tooltip title="Add parent id">
                        <IconButton size="small" aria-label="AddParentId" onClick={() => {
                            if (parentIdToAdd) {
                                onAddParent(parentIdToAdd);
                                setParentIdToAdd('');
                            }
                        }}>
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
        </>
    );
};

interface ViewsEditorProps {
    viewIds: string[];
    onAddView: (viewId: string) => void;
    onRemoveView: (index: number) => void;
    entities: Dictionary<any>;
}

const ViewsEditor: React.FC<ViewsEditorProps> = ({ viewIds, onAddView, onRemoveView, entities }) => {
    const [viewIdToAdd, setViewIdToAdd] = useState('');
    return (
        <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {viewIds.map((viewId, idx) => (
                    <Chip
                        key={viewId + idx}
                        label={entities && entities[viewId] ? `${entities[viewId].code} (${viewId})` : viewId}
                        onDelete={() => onRemoveView(idx)}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                ))}
            </Stack>
            <Grid container spacing={0} alignItems="center">
                <Grid item xs={10} sm={10}>
                    <TextField
                        fullWidth
                        label="Add view ID"
                        margin="none"
                        placeholder="Enter view entity id"
                        value={viewIdToAdd}
                        onChange={e => setViewIdToAdd(e.target.value)}
                    />
                </Grid>
                <Grid item xs={2} sm={2}>
                    <Tooltip title="Add view">
                        <IconButton size="small" aria-label="AddView" onClick={() => {
                            if (viewIdToAdd) {
                                onAddView(viewIdToAdd);
                                setViewIdToAdd('');
                            }
                        }}>
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
        </>
    );
};

const EntityComponent: React.FC = () => {
    const { id: entityId } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const entity = useAppSelector((state) => selectEntity(state, entityId));
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogValue, setDialogValue] = useState('');
    const [currentValueIndex, setCurrentValueIndex] = useState<number>(-1);
    const entities = useSelector((state: any) => state.entities.entities);

    useEffect(() => {
        if (entityId) {
            dispatch(getEntity({ id: entityId }));
        }
    }, [entityId, dispatch]);

    const [saveOk, setSaveOk] = useState(false);
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            code: entity?.code || '',
            mainParentId: entity?.mainParentId || '',
            values: entity?.values || [],
            viewIds: entity?.viewIds || [],
        },
        onSubmit: (values) => {
            if (entityId) {
                dispatch(updateEntity({
                    id: entityId,
                    code: values.code,
                    parentIds: values.mainParentId ? [values.mainParentId] : undefined,
                    codeIsUnique: undefined,
                    order: undefined,
                    hidden: undefined,
                    version: entity?.version,
                }) as any);
                setSaveOk(true);
            }
        },
    });

    const handleAddValue = () => {
        formik.setFieldValue('values', [...formik.values.values, { type: '', value: '', parents: [] }]);
    };

    const handleDeleteValue = (index: number) => {
        const updated = formik.values.values.filter((_, i) => i !== index);
        formik.setFieldValue('values', updated);
    };

    const handleOpenEditor = (value: string, index: number) => {
        setDialogValue(value);
        setCurrentValueIndex(index);
        setDialogOpen(true);
    };

    const handleCloseEditor = () => {
        setDialogOpen(false);
    };

    const handleEditorUpdate = (value: string) => {
        if (currentValueIndex !== -1) {
            const updated = [...formik.values.values];
            updated[currentValueIndex] = { ...updated[currentValueIndex], value };
            formik.setFieldValue('values', updated);
        }
    };

    if (!entity) {
        return <div>Loading...</div>;
    }

    return (
        <>
        <StyledPaper variant="outlined">
            {entityId && <File entityId={entityId} />}
            <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={5}>
                    <Grid item sm={12} lg={6}>
                        <Grid container spacing={5}>
                            <Grid item sm={12} lg={12}>
                                <Typography variant="h6" gutterBottom>
                                    Entity Details
                                </Typography>
                                <div>
                                    <span>{entityId}</span>
                                    {entity && (
                                        <span style={{ marginLeft: 16 }}>
                                            {entity.creationTime ? new Date(entity.creationTime).toLocaleString() : ''} {entity.version !== undefined ? `v${entity.version}` : ''}
                                        </span>
                                    )}
                                </div>
                                <TextField
                                    fullWidth
                                    label="Code"
                                    name="code"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    label="Main Parent ID"
                                    name="mainParentId"
                                    value={formik.values.mainParentId}
                                    onChange={formik.handleChange}
                                    margin="normal"
                                />
                                <ViewsEditor
                                    viewIds={formik.values.viewIds || []}
                                    onAddView={viewId => {
                                        formik.setFieldValue('viewIds', [...(formik.values.viewIds || []), viewId]);
                                    }}
                                    onRemoveView={idx => {
                                        formik.setFieldValue('viewIds', formik.values.viewIds.filter((_: any, i: number) => i !== idx));
                                    }}
                                    entities={entities}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item sm={12} lg={6}>
                        <Typography variant="h6" gutterBottom>
                            Values
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={10}>
                                {/* Add parent ID input if needed */}
                            </Grid>
                            <Grid item xs={2}>
                                <Tooltip title="Add value">
                                    <IconButton onClick={handleAddValue} color="primary">
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                        {formik.values.values.map((value: EntityValue, index: number) => (
                            <StyledCard key={index}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={2}>
                                            <TextField
                                                select
                                                label="Type"
                                                fullWidth
                                                value={value.type}
                                                onChange={(e) => {
                                                    const updated = [...formik.values.values];
                                                    updated[index] = { ...updated[index], type: e.target.value };
                                                    formik.setFieldValue('values', updated);
                                                }}
                                                SelectProps={{ native: true }}
                                            >
                                                <option value="" />
                                                <option value={'StringValue'}>String</option>
                                                <option value={'DoubleValue'}>Double</option>
                                                <option value={'DateTimeValue'}>DateTime</option>
                                                <option value={'FileValue'}>File</option>
                                                <option value={'IntValue'}>Int</option>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <TextField
                                                label="Value"
                                                fullWidth
                                                value={value.value}
                                                onChange={(e) => {
                                                    const updated = [...formik.values.values];
                                                    updated[index] = { ...updated[index], value: e.target.value };
                                                    formik.setFieldValue('values', updated);
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Tooltip title="Edit value">
                                                <IconButton onClick={() => handleOpenEditor(value.value, index)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Tooltip title="Delete value">
                                                <IconButton onClick={() => handleDeleteValue(index)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Grid>
                                    </Grid>
                                    <ParentsEditor
                                        parents={value.parents}
                                        onAddParent={parentId => {
                                            const updated = [...formik.values.values];
                                            updated[index] = { ...updated[index], parents: [...(updated[index].parents || []), parentId] };
                                            formik.setFieldValue('values', updated);
                                        }}
                                        onRemoveParent={parentIdx => {
                                            const updated = [...formik.values.values];
                                            updated[index] = { ...updated[index], parents: updated[index].parents.filter((_: any, i: number) => i !== parentIdx) };
                                            formik.setFieldValue('values', updated);
                                        }}
                                        entities={entities}
                                    />
                                </CardContent>
                            </StyledCard>
                        ))}
                        <Button size="small" onClick={handleAddValue} sx={{ mt: 2 }}>
                            Add value
                        </Button>
                    </Grid>
                    <Grid item sm={12} lg={6}>
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                        >
                            Update entity
                        </Button>
                    </Grid>
                </Grid>
            </form>
            <Dialog
                open={dialogOpen}
                onClose={handleCloseEditor}
                maxWidth={false}
                fullWidth
                fullScreen
            >
                <DialogTitleStyled>
                    Editor
                    <IconButton aria-label="close" onClick={handleCloseEditor}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitleStyled>
                <Editor 
                    value={dialogValue} 
                    onChange={handleEditorUpdate}
                    language="tsx"
                    title="View Script Editor"
                />
            </Dialog>
        </StyledPaper>
        <Snackbar open={saveOk} autoHideDuration={2000} onClose={() => setSaveOk(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={() => setSaveOk(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
                Entity updated
            </Alert>
        </Snackbar>
        </>
    );
};

export default EntityComponent;
