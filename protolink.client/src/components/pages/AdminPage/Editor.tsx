import * as React from 'react';
import { Box, TextField } from '@mui/material';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
    return (
        <Box sx={{ p: 2 }}>
            <TextField
                fullWidth
                multiline
                rows={20}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                variant="outlined"
            />
        </Box>
    );
};

export default Editor; 