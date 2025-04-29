import * as React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Paper, TextField, IconButton, Typography, Card, CardContent, Grid, Tooltip, Dialog, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { getEntity, loadViewScript } from '../../../store/actions/thunkActions/entities';
import type { EntityValue } from '../../../types/entities';
import type { RootState } from '../../../store';
import { useAppDispatch } from '../../../store/reducers/store';
import { addValue, deleteValue, addView, deleteView } from '../../../store/entitiesSlice';
import Editor from './Editor';

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

const DialogTitleStyled = styled(DialogTitle)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

const Entity: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const [valueParentIdToAdd, setValueParentIdToAdd] = React.useState<string>('');
    const [viewIdToAdd, setViewIdToAdd] = React.useState<string>('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogValue, setDialogValue] = React.useState<string>('');
    const [currentValueIndex, setCurrentValueIndex] = React.useState<number>(-1);

    const entity = useSelector((state: RootState) => state.entities.currentEntity);

    useEffect(() => {
        if (id) {
            dispatch(getEntity({ id }));
            dispatch(loadViewScript(id));
        }
    }, [id, dispatch]);

    const handleAddValue = () => {
        if (id) {
            const newValue: EntityValue = {
                type: '',
                value: '',
                parents: valueParentIdToAdd ? [valueParentIdToAdd] : []
            };
            dispatch(addValue({ id, value: newValue }));
            setValueParentIdToAdd('');
        }
    };

    const handleDeleteValue = (index: number) => {
        if (id) {
            dispatch(deleteValue({ id, index }));
        }
    };

    const handleAddView = () => {
        if (id && viewIdToAdd) {
            dispatch(addView({ id, viewId: viewIdToAdd }));
            setViewIdToAdd('');
        }
    };

    const handleDeleteView = (viewId: string) => {
        if (id) {
            dispatch(deleteView({ id, viewId }));
        }
    };

    const handleUpdateValue = (index: number, field: 'type' | 'value', newValue: string) => {
        if (id && entity) {
            const updatedValues = [...entity.values];
            updatedValues[index] = {
                ...updatedValues[index],
                [field]: newValue
            };
            dispatch(addValue({ id, value: updatedValues[index] }));
        }
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
            handleUpdateValue(currentValueIndex, 'value', value);
        }
    };

    if (!entity) {
        return <div>Loading...</div>;
    }

    return (
        <StyledPaper variant="outlined">
            <Grid container spacing={5}>
                <Grid item sm={12} lg={6}>
                    <Grid container spacing={5}>
                        <Grid item sm={12} lg={12}>
                            <Typography variant="h6" gutterBottom>
                                Entity Details
                            </Typography>
                            <div>
                                <span>{id}</span>
                            </div>
                            <TextField
                                fullWidth
                                label="Code"
                                value={entity.code || ''}
                                disabled
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Main Parent ID"
                                value={entity.mainParentId || ''}
                                disabled
                                margin="normal"
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
                            <TextField
                                label="Parent ID for new value"
                                fullWidth
                                value={valueParentIdToAdd}
                                onChange={(e) => setValueParentIdToAdd(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <Tooltip title="Add value">
                                <IconButton onClick={handleAddValue} color="primary">
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                    {entity.values.map((value, index) => (
                        <StyledCard key={index}>
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={2}>
                                        <TextField
                                            label="Type"
                                            fullWidth
                                            value={value.type}
                                            onChange={(e) => handleUpdateValue(index, 'type', e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={8}>
                                        <TextField
                                            label="Value"
                                            fullWidth
                                            value={value.value}
                                            onChange={(e) => handleUpdateValue(index, 'value', e.target.value)}
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
                            </CardContent>
                        </StyledCard>
                    ))}
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Views
            </Typography>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={10}>
                    <TextField
                        label="View ID"
                        fullWidth
                        value={viewIdToAdd}
                        onChange={(e) => setViewIdToAdd(e.target.value)}
                    />
                </Grid>
                <Grid item xs={2}>
                    <Tooltip title="Add view">
                        <span>
                            <IconButton onClick={handleAddView} color="primary" disabled={!viewIdToAdd}>
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Grid>
            </Grid>
            {entity.viewIds.map((viewId) => (
                <StyledCard key={viewId}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={10}>
                                <Typography>{viewId}</Typography>
                            </Grid>
                            <Grid item xs={2}>
                                <Tooltip title="Delete view">
                                    <IconButton onClick={() => handleDeleteView(viewId)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </CardContent>
                </StyledCard>
            ))}

            <Dialog
                fullScreen
                open={dialogOpen}
                onClose={handleCloseEditor}
                maxWidth={false}
            >
                <DialogTitleStyled>
                    Editor
                    <IconButton onClick={handleCloseEditor}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitleStyled>
                <Editor
                    value={dialogValue}
                    onChange={handleEditorUpdate}
                />
            </Dialog>
        </StyledPaper>
    );
};

export default Entity; 