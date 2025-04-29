import * as React from 'react';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Grid, Paper, Button, TextField, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { styled } from '@mui/material/styles';
import { useAppDispatch } from '../../../store/reducers/store';
import { getEntities, deleteEntity, addParent, addEntityAndSelect } from '../../../store/actions/thunkActions/entities';
import type { RootState } from '../../../store';
import type { Entity } from '../../../types/entities';

const StyledPaper = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'left',
    padding: theme.spacing(2, 4, 3),
}));

const StyledTable = styled('table')({
    width: '100%',
    borderCollapse: 'collapse',
});

const StyledActionCell = styled('td')({
    width: '100px',
});

const StyledItem = styled('tr')({
    '&:hover': {
        '& $hiddenAction': {
            visibility: 'visible',
            opacity: '1',
            transition: 'opacity 0s, visibility 0s',
        },
    },
});

const StyledAction = styled('td')({
    cursor: 'pointer',
});

const StyledHiddenAction = styled('span')({
    cursor: 'pointer',
    visibility: 'hidden',
    opacity: '0',
    transition: 'opacity 1s, visibility 1s',
});

const Entities: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [parentIdToAdd, setParentIdToAdd] = React.useState<string>('');

    const entities = useSelector((state: RootState) => {
        console.log('Entities state:', state.entities);
        return Array.isArray(state.entities.entities) ? state.entities.entities : [];
    });
    console.log('Processed entities:', entities);
    const children = entities.filter((e: Entity) => e.mainParentId === id);
    const parents = entities.filter((e: Entity) => e.id === id ? e.mainParentId : false);

    useEffect(() => {
        load(id);
    }, [id]);

    const load = (entityId: string | undefined) => {
        if (entityId) {
            dispatch(getEntities({ parentIds: [entityId] }));
            dispatch(getEntities({ idsToFindParents: [entityId] }));
        } else {
            dispatch(getEntities({}));
        }
    };

    const handleParentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setParentIdToAdd(e.target.value);
    };

    const handleAddParent = () => {
        if (id && parentIdToAdd) {
            dispatch(addParent({ id, parentId: parentIdToAdd }));
            setParentIdToAdd('');
        }
    };

    const handleDeleteEntity = (entityId: string) => {
        dispatch(deleteEntity({ id: entityId }));
    };

    const handleAddEntity = () => {
        if (id) {
            dispatch(addEntityAndSelect({
                name: '',
                description: '',
                code: '',
                codeIsUnique: false,
                order: 0,
                parentIds: id,
                hidden: false
            }));
        }
    };

    const handleNavigate = (entityId: string) => {
        navigate(`/admin/${entityId}`);
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
                <StyledPaper variant="outlined">
                    <StyledTable>
                        <thead>
                            <tr>
                                <th>Parents</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <TextField
                                        label="ParentId to add"
                                        margin="none"
                                        fullWidth
                                        value={parentIdToAdd}
                                        onChange={handleParentIdChange}
                                    />
                                </td>
                                <td>
                                    <Tooltip title="Add parent">
                                        <span>
                                            <IconButton onClick={handleAddParent} color="primary" disabled={!parentIdToAdd}>
                                                <AddIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </td>
                            </tr>
                            {!id && (
                                <tr>
                                    <td colSpan={2}>
                                        <Button
                                            type="button"
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => navigate('/admin')}
                                        >
                                            Go to root
                                        </Button>
                                    </td>
                                </tr>
                            )}
                            {parents.map((entity: Entity) => (
                                <StyledItem key={entity.id}>
                                    <StyledAction onClick={() => handleNavigate(entity.id)}>
                                        {entity.code}
                                    </StyledAction>
                                    <td>
                                        <StyledHiddenAction>
                                            <Tooltip title={`Copy ${entity.id}`}>
                                                <CopyToClipboard text={entity.id}>
                                                    <IconButton size="small" aria-label="CopyEntityId">
                                                        <FileCopyIcon />
                                                    </IconButton>
                                                </CopyToClipboard>
                                            </Tooltip>
                                            <Tooltip title="Remove entity">
                                                <IconButton
                                                    size="small"
                                                    aria-label="RemoveEntity"
                                                    onClick={() => handleDeleteEntity(entity.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </StyledHiddenAction>
                                    </td>
                                </StyledItem>
                            ))}
                        </tbody>
                    </StyledTable>
                </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6}>
                <StyledPaper variant="outlined">
                    <StyledTable>
                        <thead>
                            <tr>
                                <th>Children</th>
                                <StyledActionCell></StyledActionCell>
                            </tr>
                        </thead>
                        <tbody>
                            {!children && (
                                <tr>
                                    <td colSpan={2}>Loading...</td>
                                </tr>
                            )}
                            {children.map((entity: Entity) => (
                                <StyledItem key={entity.id}>
                                    <StyledAction onClick={() => handleNavigate(entity.id)}>
                                        {entity.code || entity.id}
                                    </StyledAction>
                                    <td>
                                        <StyledHiddenAction>
                                            <Tooltip title={`Copy ${entity.id}`}>
                                                <CopyToClipboard text={entity.id}>
                                                    <IconButton size="small" aria-label="CopyEntityId">
                                                        <FileCopyIcon />
                                                    </IconButton>
                                                </CopyToClipboard>
                                            </Tooltip>
                                            <Tooltip title="Remove entity">
                                                <IconButton
                                                    size="small"
                                                    aria-label="RemoveEntity"
                                                    onClick={() => handleDeleteEntity(entity.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </StyledHiddenAction>
                                    </td>
                                </StyledItem>
                            ))}
                        </tbody>
                    </StyledTable>
                    <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        onClick={handleAddEntity}
                    >
                        Add entity
                    </Button>
                </StyledPaper>
            </Grid>
        </Grid>
    );
};

export default Entities; 