import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { getFiles, addFile, deleteFile } from '../../store/actions/thunkActions/files';
import type { RootState } from '../../store/store';

const Image = styled('img')(() => ({
    height: '50px',
}));

const ImageContainer = styled('div')({
    display: 'inline-block',
    margin: 8,
});

interface FileProps {
    entityId: string;
}

const File: React.FC<FileProps> = ({ entityId }) => {
    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const files = useSelector((state: RootState) => entityId ? state.files.filesByEntity[entityId] : undefined);
    const loading = useSelector((state: RootState) => state.files.loading);

    useEffect(() => {
        if (entityId) {
            dispatch(getFiles({ entityIds: [entityId] }) as any);
        }
    }, [entityId, dispatch]);

    const handleUploadClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && entityId) {
            const file = e.target.files[0];
            const fileId = crypto.randomUUID();
            dispatch(addFile({ entityId, fileId, file }) as any).then(() => {
                dispatch(getFiles({ entityIds: [entityId] }) as any);
            });
        }
    };

    const handleDelete = (fileId: string) => {
        dispatch(deleteFile({ fileId }) as any).then(() => {
            if (entityId) dispatch(getFiles({ entityIds: [entityId] }) as any);
        });
    };

    const getFileUrl = (fileId: string) => `/api/files/getFile/${fileId}`;

    return (
        <div>
            {loading && <CircularProgress />}
            {!loading && !files && 'Загружается...'}
            {!loading && files && files.map((file, index) => (
                <ImageContainer key={file.id}>
                    <Image src={getFileUrl(file.id)} alt={'image' + index} />
                    <br />
                    <IconButton onClick={() => handleDelete(file.id)} color="primary">
                        <DeleteIcon />
                    </IconButton>
                </ImageContainer>
            ))}
            <input
                ref={inputRef}
                style={{ display: 'none' }}
                id="raised-button-file"
                multiple={false}
                type="file"
                onChange={handleFileChange}
            />
            <Button
                onClick={handleUploadClick}
                variant="contained"
                color="primary"
            >
                Загрузить
            </Button>
        </div>
    );
};

export default File; 