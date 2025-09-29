import * as React from 'react';
import { Box, TextField, Typography, Chip, Stack } from '@mui/material';
import { Code, Expand, FullscreenExit } from '@mui/icons-material';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: 'javascript' | 'typescript' | 'tsx' | 'jsx' | 'json';
    title?: string;
}

const Editor: React.FC<EditorProps> = ({ 
    value, 
    onChange, 
    language = 'tsx',
    title = 'Code Editor'
}) => {
    const [isMaximized, setIsMaximized] = React.useState(false);
    const [showSyntaxHints, setShowSyntaxHints] = React.useState(true);

    const getLanguageLabel = (lang: string) => {
        switch (lang) {
            case 'tsx': return 'TSX';
            case 'jsx': return 'JSX';
            case 'typescript': return 'TypeScript';
            case 'javascript': return 'JavaScript';
            case 'json': return 'JSON';
            default: return lang.toUpperCase();
        }
    };

    const getSyntaxHints = () => {
        if (!showSyntaxHints) return null;
        
        const hints: { [key: string]: string[] } = {
            tsx: [
                'Use React.createElement() for JSX',
                'Import React: var React = window.React',
                'Use useState: var useState = React.useState',
                'Use useEffect: var useEffect = React.useEffect',
                'Export: window[\'{id}\'] = function Component() { ... }'
            ],
            jsx: [
                'Use React.createElement() for JSX',
                'Import React: var React = window.React',
                'Return JSX: return React.createElement(...)',
                'Export: window[\'{id}\'] = function Component() { ... }'
            ],
            javascript: [
                'Use plain JavaScript syntax',
                'No JSX - use React.createElement()',
                'Import React: var React = window.React',
                'Export: window[\'{id}\'] = function Component() { ... }'
            ],
            typescript: [
                'Use TypeScript syntax with React',
                'Import React: var React = window.React',
                'Use proper typing for props and state',
                'Export: window[\'{id}\'] = function Component() { ... }'
            ],
            json: [
                'Use valid JSON syntax',
                'No comments allowed in JSON',
                'All strings must be in double quotes',
                'Trailing commas are not allowed'
            ]
        };

        return hints[language] || hints.javascript;
    };

    return (
        <Box sx={{ 
            height: isMaximized ? '100vh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: isMaximized ? 'fixed' : 'relative',
            top: isMaximized ? 0 : 'auto',
            left: isMaximized ? 0 : 'auto',
            right: isMaximized ? 0 : 'auto',
            bottom: isMaximized ? 0 : 'auto',
            zIndex: isMaximized ? 9999 : 'auto',
            backgroundColor: 'background.paper'
        }}>
            {/* Header */}
            <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'grey.50'
            }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" component="h2">
                        {title}
                    </Typography>
                    <Chip 
                        label={getLanguageLabel(language)} 
                        color="primary" 
                        size="small"
                        icon={<Code />}
                    />
                </Stack>
                
                <Stack direction="row" spacing={1}>
                    <Chip
                        label={showSyntaxHints ? 'Hide Hints' : 'Show Hints'}
                        onClick={() => setShowSyntaxHints(!showSyntaxHints)}
                        size="small"
                        variant="outlined"
                    />
                    <Chip
                        icon={isMaximized ? <FullscreenExit /> : <Expand />}
                        label={isMaximized ? 'Minimize' : 'Maximize'}
                        onClick={() => setIsMaximized(!isMaximized)}
                        size="small"
                        color="secondary"
                    />
                </Stack>
            </Box>

            {/* Syntax Hints */}
            {showSyntaxHints && getSyntaxHints() && (
                <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'info.light', 
                    borderBottom: 1, 
                    borderColor: 'divider' 
                }}>
                    <Typography variant="subtitle2" gutterBottom>
                        {language.toUpperCase()} Syntax Hints:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {getSyntaxHints()?.map((hint: string, index: number) => (
                            <Chip 
                                key={index}
                                label={hint} 
                                size="small" 
                                variant="outlined"
                                sx={{ mb: 0.5 }}
                            />
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Editor */}
            <Box sx={{ 
                flex: 1, 
                p: 2,
                minHeight: isMaximized ? 'calc(100vh - 200px)' : '500px'
            }}>
                <TextField
                    fullWidth
                    multiline
                    rows={isMaximized ? 30 : 20}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    variant="outlined"
                    placeholder={`Enter your ${language.toUpperCase()} code here...`}
                    sx={{
                        '& .MuiInputBase-root': {
                            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                            fontSize: '14px',
                            lineHeight: 1.5
                        },
                        '& .MuiInputBase-input': {
                            resize: 'vertical',
                            minHeight: isMaximized ? 'calc(100vh - 300px)' : '400px'
                        }
                    }}
                />
            </Box>

            {/* Footer */}
            <Box sx={{ 
                p: 2, 
                borderTop: 1, 
                borderColor: 'divider',
                backgroundColor: 'grey.50',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="caption" color="text.secondary">
                    Lines: {value.split('\n').length} | Characters: {value.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {isMaximized ? 'Press ESC or click Minimize to exit fullscreen' : 'Press F11 or click Maximize for fullscreen editing'}
                </Typography>
            </Box>
        </Box>
    );
};

export default Editor; 