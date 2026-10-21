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

const FALLBACK_LANGUAGES: Language[] = [
  {
    id: '00010002-0001-0000-0000-000000000000',
    code: 'ru-RU',
    name: 'Русский',
    shortLabel: 'RU',
    accessibilityName: 'Русский',
  },
  {
    id: '00010002-0002-0000-0000-000000000000',
    code: 'en-US',
    name: 'English',
    shortLabel: 'EN',
    accessibilityName: 'English',
  },
]

const UrlLanguageSelector: React.FC = () => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [currentLanguage, setCurrentLanguage] = useState<string>('en-US')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setLoading(true)
        const langs = await urlLanguageService.loadLanguages()
        setLanguages(langs.length ? langs : FALLBACK_LANGUAGES)
        setCurrentLanguage(urlLanguageService.getLanguageFromUrl())
      } catch (error) {
        console.error('Error loading languages:', error)
        setLanguages(FALLBACK_LANGUAGES)
      } finally {
        setLoading(false)
      }
    }

    void loadLanguages()
  }, [])

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value
    setCurrentLanguage(newLang)
    urlLanguageService.setLanguage(newLang)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
        <CircularProgress size={18} sx={{ color: '#5F6368' }} />
      </Box>
    )
  }

  const current = languages.find((item) => item.code === currentLanguage)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 80 }}>
      <Tooltip
        title={current?.accessibilityName || currentLanguage}
        arrow
        open={menuOpen ? false : undefined}
      >
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
            onOpen={() => setMenuOpen(true)}
            onClose={() => setMenuOpen(false)}
            displayEmpty
            variant="outlined"
            renderValue={(selected) => {
              const lang = languages.find((item) => item.code === selected)
              return (
                <Typography variant="caption" sx={{ color: '#202124', fontSize: '12px' }}>
                  {lang?.shortLabel || String(selected).slice(0, 2).toUpperCase()}
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
              <MenuItem
                key={lang.id ?? lang.code}
                value={lang.code}
                aria-label={lang.accessibilityName}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 28 }}>
                    {lang.shortLabel}
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1 }}>
                    {lang.name}
                  </Typography>
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
