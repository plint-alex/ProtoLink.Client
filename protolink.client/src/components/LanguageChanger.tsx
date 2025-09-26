import React from 'react'
import { 
  FormControl, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Box,
  Typography
} from '@mui/material'
import { Language as LanguageIcon } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

const LanguageChanger: React.FC = () => {
  const { language, setLanguage, getTextSync } = useLanguage()

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value)
  }

  const languages = [
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
  ]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
      <LanguageIcon sx={{ mr: 1, color: 'inherit' }} />
      <FormControl 
        size="small" 
        sx={{ 
          minWidth: 100,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.7)',
          },
          '& .MuiSelect-select': {
            color: 'inherit',
            padding: '8px 12px',
          },
          '& .MuiSelect-icon': {
            color: 'inherit',
          }
        }}
      >
        <Select
          value={language}
          onChange={handleLanguageChange}
          displayEmpty
          variant="outlined"
          sx={{
            color: 'inherit',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1, fontSize: '1.2em' }}>
                  {lang.flag}
                </Typography>
                <Typography variant="body2">
                  {lang.name}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default LanguageChanger
