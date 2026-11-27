import * as React from 'react';
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useNavigationWithParams } from '../../hooks/useNavigationWithParams';
import { Grid, Paper, Button, TextField, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { styled } from '@mui/material/styles';
import { selectEntities, useAppDispatch, useAppSelector } from '../../store/store';
import {
    getEntities,
    deleteEntity,
    addParent,
    removeParent,
    addEntityAndSelect,
} from '../../store/actions/thunkActions/entities';
import type { Entity } from '../../types/entities';
import { copyText } from '../../services/copyText';
import {
    resolveExplorerChromeLabel,
    textCatalogService,
} from '../../services/textCatalogService';
import { SYSTEM_PAGE_CODES } from '../../resources/routes-constants';
import { explorerEntityLabel } from './explorerEntityLabel';
import { explorerChildrenRows } from './explorerChildrenRows';
import {
    EXPLORER_ROW_ACTIONS_CLASS,
    deleteEntitySubtree,
    explorerDeleteConfirmMessage,
    explorerUnlinkParentConfirmMessage,
    resolveExplorerAfterDelete,
    unlinkExplorerParent,
} from './explorerDeleteCascade';

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

/** Emotion (not JSS): use a real class — `$hiddenAction` never matched. */
const StyledItem = styled('tr')({
    [`&:hover .${EXPLORER_ROW_ACTIONS_CLASS}`]: {
        visibility: 'visible',
        opacity: 1,
        transition: 'opacity 0s, visibility 0s',
    },
});

const StyledAction = styled('td')({
    cursor: 'pointer',
});

const StyledHiddenAction = styled('span')({
    cursor: 'pointer',
    visibility: 'hidden',
    opacity: 0,
    transition: 'opacity 1s, visibility 1s',
});

const Entities: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigateWithParams = useNavigationWithParams();
    const dispatch = useAppDispatch();
    const [parentIdToAdd, setParentIdToAdd] = React.useState<string>('');
    const [deleting, setDeleting] = React.useState(false);
    const lang = React.useMemo(() => new URLSearchParams(location.search).get('lang') || 'en-US', [location.search]);
    const [texts, setTexts] = React.useState<Record<string, string>>({});
    // Catalog kids under sys-page-explorer-root may be empty on prod — EN defaults, not raw codes.
    const t = React.useCallback(
        (code: string) => resolveExplorerChromeLabel(code, texts),
        [texts]
    );

    const children = useAppSelector((state) => selectEntities(state, 'children'));
    const parents = useAppSelector((state) => selectEntities(state, 'parents'));
    const [openEntity, setOpenEntity] = React.useState<Entity | null>(null);
    const childrenRows = React.useMemo(
        () => explorerChildrenRows(openEntity, children),
        [openEntity, children]
    );

    const reloadLists = React.useCallback(
        (openId: string | undefined) => {
            if (openId) {
                void (async () => {
                    try {
                        const openResult = await dispatch(
                            getEntities({
                                data: { ids: [openId], includeValues: true },
                            })
                        ).unwrap();
                        setOpenEntity(openResult.data?.[0] ?? null);
                    } catch (error) {
                        console.error('[Explorer] failed to load open entity', error);
                        setOpenEntity(null);
                    }
                })();
                void dispatch(
                    getEntities({
                        data: { parentIds: [openId], includeValues: true },
                        storageVariable: 'children',
                    })
                );
                void dispatch(
                    getEntities({
                        data: { idsToFindParents: [openId], includeValues: true },
                        storageVariable: 'parents',
                    })
                );
            } else {
                setOpenEntity(null);
                void dispatch(getEntities({ data: {}, storageVariable: 'children' }));
            }
        },
        [dispatch]
    );

    const listChildrenForCascade = React.useCallback(
        async (parentId: string) => {
            const result = await dispatch(
                getEntities({
                    data: { parentIds: [parentId], includeValues: false },
                })
            ).unwrap();
            return (result.data || []).map((row) => ({ id: row.id }));
        },
        [dispatch]
    );

    const deleteEntityById = React.useCallback(
        async (entityId: string) => {
            await dispatch(deleteEntity({ id: entityId })).unwrap();
        },
        [dispatch]
    );

    const handleParentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setParentIdToAdd(e.target.value);
    };

    const handleAddParent = () => {
        if (id && parentIdToAdd) {
            dispatch(addParent({ id, parentId: parentIdToAdd }));
            setParentIdToAdd('');
        }
    };

    /** Parent-row Remove: unlink only — never cascade DeleteEntity on the parent. */
    const handleUnlinkParent = async (parent: Entity) => {
        if (!id || deleting) {
            return;
        }
        const label = explorerEntityLabel(parent);
        if (!window.confirm(explorerUnlinkParentConfirmMessage(label))) {
            return;
        }

        setDeleting(true);
        try {
            await unlinkExplorerParent(id, parent.id, async (params) => {
                await dispatch(removeParent(params)).unwrap();
            });
            reloadLists(id);
        } catch (error) {
            console.error('[Explorer] unlink parent failed', error);
            reloadLists(id);
        } finally {
            setDeleting(false);
        }
    };

    /** Child-row Remove: cascade that target (+ descendants) only. Open-entity Delete lives on Entity. */
    const handleDeleteSubtree = async (entityId: string, label: string) => {
        if (deleting) {
            return;
        }
        if (!window.confirm(explorerDeleteConfirmMessage(label))) {
            return;
        }

        setDeleting(true);
        const remainingParentIds = parents.map((p) => p.id);

        try {
            await deleteEntitySubtree(entityId, listChildrenForCascade, deleteEntityById);

            const next = resolveExplorerAfterDelete({
                openId: id,
                deletedId: entityId,
                remainingParentIds,
            });

            if (next.action === 'navigate') {
                navigateWithParams(next.path);
            } else {
                reloadLists(id);
            }
        } catch (error) {
            console.error('[Explorer] cascade delete failed', error);
            reloadLists(id);
        } finally {
            setDeleting(false);
        }
    };

    const handleAddEntity = async (entityId?: string) => {
        const result = await dispatch(addEntityAndSelect({
            name: '',
            description: '',
            code: '',
            codeIsUnique: false,
            order: 0,
            parentIds: entityId? [entityId]: [],
            hidden: false
        }));

        if (result.payload) {
            handleNavigate((result.payload as { id: string }).id);
        }
    };

    const handleNavigate = (entityId: string) => {
        navigateWithParams(`/explorer/${entityId}`);
    };

    const handleCopyEntityId = (entityId: string) => {
        void copyText(entityId);
    };

    useEffect(() => {
        // Reload data when id changes
        // The deduplication in thunks will prevent actual duplicate requests
        reloadLists(id);
    }, [id, reloadLists]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                // Never pass explored entity as routeEntityId — chrome texts live under
                // sys-page-explorer-root (22f9f37a…), not under the open graph entity.
                const loadedTexts = await textCatalogService.loadPageTexts({
                    lang,
                    systemPageCode: SYSTEM_PAGE_CODES.EXPLORER_ROOT,
                    pathname: location.pathname,
                });
                if (!cancelled) {
                    setTexts((prev) => ({ ...prev, ...loadedTexts }));
                }
            } catch (error) {
                console.error('[Explorer] failed to load page texts', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [lang, location.pathname]);

    const renderCopyAction = (entityId: string) => (
        <Tooltip title={`${t('explorer-copy')} ${entityId}`}>
            <IconButton
                size="small"
                aria-label="CopyEntityId"
                disabled={deleting}
                onClick={() => handleCopyEntityId(entityId)}
            >
                <FileCopyIcon />
            </IconButton>
        </Tooltip>
    );

    const renderParentRowActions = (entity: Entity) => (
        <StyledHiddenAction className={EXPLORER_ROW_ACTIONS_CLASS}>
            {renderCopyAction(entity.id)}
            <Tooltip title={t('explorer-unlink-parent')}>
                <IconButton
                    size="small"
                    aria-label="UnlinkParent"
                    disabled={deleting || !id}
                    onClick={() => void handleUnlinkParent(entity)}
                >
                    <LinkOffIcon />
                </IconButton>
            </Tooltip>
        </StyledHiddenAction>
    );

    const renderChildRowActions = (entity: Entity) => (
        <StyledHiddenAction className={EXPLORER_ROW_ACTIONS_CLASS}>
            {renderCopyAction(entity.id)}
            <Tooltip title={t('explorer-remove-entity')}>
                <IconButton
                    size="small"
                    aria-label="RemoveEntity"
                    disabled={deleting}
                    onClick={() => void handleDeleteSubtree(entity.id, explorerEntityLabel(entity))}
                >
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        </StyledHiddenAction>
    );

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
                <StyledPaper variant="outlined">
                    <StyledTable>
                        <thead>
                            <tr>
                                <th>{t('explorer-parents')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <TextField
                                        label={t('explorer-parent-id-to-add')}
                                        margin="none"
                                        fullWidth
                                        value={parentIdToAdd}
                                        onChange={handleParentIdChange}
                                    />
                                </td>
                                <td>
                                    <Tooltip title={t('explorer-add-parent')}>
                                        <span>
                                            <IconButton onClick={handleAddParent} color="primary" disabled={!parentIdToAdd || deleting}>
                                                <AddIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                                    <Button
                                        type="button"
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        onClick={() => navigateWithParams('/explorer')}
                                    >
                                        {t('explorer-go-to-root')}
                                    </Button>
                                </td>
                            </tr>
                            {parents && parents.map((entity: Entity) => (
                                <StyledItem key={entity.id}>
                                    <StyledAction onClick={() => handleNavigate(entity.id)}>
                                        {explorerEntityLabel(entity)}
                                    </StyledAction>
                                    <td>
                                        {renderParentRowActions(entity)}
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
                                <th>{t('explorer-children')}</th>
                                <StyledActionCell></StyledActionCell>
                            </tr>
                        </thead>
                        <tbody>
                            {!children && (
                                <tr>
                                    <td colSpan={2}>{t('explorer-loading')}</td>
                                </tr>
                            )}
                            {childrenRows.map((entity: Entity) => (
                                <StyledItem key={entity.id}>
                                    <StyledAction onClick={() => handleNavigate(entity.id)}>
                                        {explorerEntityLabel(entity)}
                                    </StyledAction>
                                    <td>
                                        {renderChildRowActions(entity)}
                                    </td>
                                </StyledItem>
                            ))}
                        </tbody>
                    </StyledTable>
                    <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        disabled={deleting}
                        onClick={() => handleAddEntity(id)}
                    >
                        {t('explorer-add-entity')}
                    </Button>
                </StyledPaper>
            </Grid>
        </Grid>
    );
};

export default Entities;
