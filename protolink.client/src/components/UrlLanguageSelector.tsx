import React, { useState, useEffect } from 'react'
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material'
import { urlLanguageService, Language } from '../services/urlLanguageService'

const UrlLanguageSelector: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [currentLanguage, setCurrentLanguage] = useState<string>('en-US')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setLoading(true)
        const langs = await urlLanguageService.loadLanguages()
        setLanguages(langs)
        
        // Get current language from URL
        const current = urlLanguageService.getLanguageFromUrl()
        setCurrentLanguage(current)
      } catch (error) {
        console.error('Error loading languages:', error)
        // Fallback to default languages
        setLanguages([
          { id: '00010002-0002-0000-0000-000000000000', code: 'en-US', name: 'English', flag: '🇺🇸' },
          { id: '00010002-0001-0000-0000-000000000000', code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadLanguages()
  }, [])

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value
    setCurrentLanguage(newLang)
    urlLanguageService.setLanguage(newLang)
  }

  const getLanguageCode = (code: string): string => {
    return code.split('-')[0]
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
        <CircularProgress size={18} sx={{ color: '#5F6368' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
      <Tooltip title={currentLanguage} arrow>
        <FormControl
          size="small"
          sx={{
            minWidth: 72,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(60, 64, 67, 0.2)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(60, 64, 67, 0.3)',
            },
            '& .MuiSelect-select': {
              color: '#202124',
              padding: '4px 26px 4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
            },
            '& .MuiSelect-icon': {
              color: '#5F6368',
            }
          }}
        >
          <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            displayEmpty
            variant="outlined"
            renderValue={(selected) => {
              const lang = languages.find((item) => item.code === selected)
              if (!lang) {
                return getLanguageCode(selected)
              }
              return (
                <Typography variant="caption" sx={{ color: '#202124', fontSize: '12px' }}>
                  {getLanguageCode(lang.code)}
                </Typography>
              )
            }}
          MenuProps={{
            PaperProps: {
              sx: {
                minWidth: 120
              }
            }
          }}
          sx={{
            color: '#202124',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(60, 64, 67, 0.2)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(60, 64, 67, 0.3)',
            },
          }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.id} value={lang.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2em' }}>
                  {lang.flag}
                </Typography>
                <Box>
                  <Typography variant="body2" sx={{ lineHeight: 1 }}>
                    {lang.name}
                  </Typography>
                  <Typography variant="caption" sx={{ lineHeight: 1 }}>
                    {lang.code}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      </Tooltip>
    </Box>
  )
}

export default UrlLanguageSelector
