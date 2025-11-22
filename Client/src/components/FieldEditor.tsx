import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Grid,
  Checkbox,
  FormControlLabel,
  InputAdornment,
} from '@mui/material'
import type { Field } from '../types'

const TYPE_OPTIONS = [
  '라인 ID',
  '제품 ID',
  '스텝 ID',
  'String 데이터',
  'String 데이터 2',
  'Number 데이터'
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

type FieldEditorProps = {
  initialTitle?: string
  initialDataCnt?: number
  initialFormat?:  'CSV' | 'JSON'
  initialFields?: Field[]
  initialFileName?: string
  onSave?: (title: string, dataCnt: number, format: 'CSV' | 'JSON', fields: Field[], fileName: string) => void
  onClose?: () => void
  isDialog?: boolean
}

export default function FieldEditor({ 
  initialTitle = '',
  initialDataCnt = 10,
  initialFormat = 'CSV',
  initialFields,
  initialFileName = '',
  onSave, 
  onClose, 
  isDialog = false 
}: FieldEditorProps = {}) {
  const defaultFields: Field[] = [
    { id: uid(), name: 'id', type: 'Number 데이터', options: { minValue: 1, maxValue: 100, decimal: 0 } },
    { id: uid(), name: 'name', type: 'String 데이터', options: { minLength: 1, maxLength: 10 } }
  ]
  
  const [title, setTitle] = useState<string>(initialTitle)
  const [dataCnt, setDataCnt] = useState<number>(initialDataCnt)
  const [format, setFormat] = useState<'CSV' | 'JSON'>(initialFormat)
  const [fields, setFields] = useState<Field[]>(initialFields || defaultFields)
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(false)
  const [scheduleUnit, setScheduleUnit] = useState<'hour' | 'day'>('hour')
  const [scheduleValue, setScheduleValue] = useState<number>(1)
  const [fileName, setFileName] = useState<string>(initialFileName)
  
  useEffect(() => {
    if (initialTitle !== undefined) {
      setTitle(initialTitle)
    }
    if (initialDataCnt !== undefined) {
      setDataCnt(initialDataCnt)
    }
    if (initialFormat !== undefined) {
      setFormat(initialFormat)
    }
    if (initialFields) {
      setFields(initialFields)
    }
    if (initialFileName !== undefined) {
      setFileName(initialFileName)
    }
  }, [initialTitle, initialDataCnt, initialFormat, initialFields, initialFileName])
  const [exportJson, setExportJson] = useState('')
  const [apiResult, setApiResult] = useState<string | null>(null)
  const [apiGrid, setApiGrid] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState(1)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [dialogFieldId, setDialogFieldId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'기준정보' | '데이터'>('기준정보')
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [stringListInputs, setStringListInputs] = useState<Record<string, string>>({})

  function addField() {
    setFields((s) => [...s, { id: uid(), name: '', type: TYPE_OPTIONS[0] }])
  }

  function removeField(id: string) {
    setFields((s) => s.filter((f) => f.id !== id))
  }

  function updateName(id: string, name: string) {
    setFields((s) => s.map((f) => (f.id === id ? { ...f, name } : f)))
  }

  function updateType(id: string, type: string) {
    setFields((s) => s.map((f) => {
      if (f.id === id) {
        if (type === 'String 데이터') {
          return { ...f, type, options: { minLength: f.options?.minLength ?? 1, maxLength: f.options?.maxLength ?? 10 } }
        } else if (type === 'String 데이터 2') {
          return { ...f, type, options: { stringList: f.options?.stringList } }
        } else if (type === 'Number 데이터') {
          return { ...f, type, options: { minValue: f.options?.minValue ?? 1, maxValue: f.options?.maxValue ?? 100, decimal: f.options?.decimal ?? 0 } }
        } else if (type === '라인 ID' || type === '제품 ID') {
          return { ...f, type, options: { setTitle: f.options?.setTitle ?? false } }
        } else if (type === '스텝 ID') {
          return { ...f, type, options: { setTitle: f.options?.setTitle ?? false, pno: f.options?.pno ?? '' } }
        } else {
          return { ...f, type, options: undefined }
        }
      }
      return f
    }))
  }

  function updateOptions(id: string, options: Field['options']) {
    const updatedFields = fields.map((f) => (f.id === id ? { ...f, options } : f))
    setFields(updatedFields)
    
    // "제목" 체크박스 체크 시 파일명에 Field Name을 {} 중괄호로 추가
    const currentField = updatedFields.find((f) => f.id === id)
    if (currentField && (currentField.type === '라인 ID' || currentField.type === '제품 ID' || currentField.type === '스텝 ID')) {
      if (options?.setTitle) {
        // 체크박스가 체크되면 현재 파일명에 Field Name을 {} 중괄호로 추가
        const fieldNameToAdd = `{${currentField.name}}`
        if (!fileName.includes(fieldNameToAdd)) {
          setFileName(fileName + fieldNameToAdd)
        }
      } else {
        // 체크박스가 해제되면 파일명에서 해당 Field Name 제거
        const fieldNameToRemove = `{${currentField.name}}`
        setFileName(fileName.replace(fieldNameToRemove, ''))
      }
    }
  }

  function exportFields() {
    const payload = fields.map(({ name, type }) => ({ name, type }))
    setExportJson(JSON.stringify(payload, null, 2))
  }

  async function sendToApi() {
    setApiResult(null)
    setSending(true)
    try {
      const payload = fields.map(({ name, type, options }) => ({ name, type, options }))
      // dynamic import to avoid circular issues in some setups
      const api = await import('../api')
      const res = await api.previewTestData(payload, dataCnt, fileName)

      // Backend returns { fileName, dataSets } 형태
      const fileNameResult = res.fileName || ''
      const dataSets = res.dataSets || res

      setPreviewFileName(fileNameResult || '')

      // Backend returns IReadOnlyList<string> where first item is header CSV
      if (Array.isArray(dataSets)) {
        // Expect array of CSV lines
        const lines: string[] = dataSets as string[]
        if (lines.length > 0) {
          const headers = lines[0].split(',')
          // Preview에서는 최대 100개까지만 표시
          const allRows = lines.slice(1).map((ln) => ln.split(','))
          const rows = allRows.slice(0, 100)
          setApiGrid({ headers, rows })
          setApiResult(null)
        } else {
          setApiGrid({ headers: [], rows: [] })
          setApiResult(null)
        }
      } else {
        // fallback: stringify any other shape
        setApiGrid(null)
        setApiResult(JSON.stringify(dataSets, null, 2))
      }
      
      // 다이얼로그 모드일 때 Preview 다이얼로그 열기
      if (isDialog) {
        setPreviewDialogOpen(true)
      }
    } catch (err: any) {
      setApiGrid(null)
      setApiResult(err?.message ?? String(err))
      // 에러가 있어도 다이얼로그 열기
      if (isDialog) {
        setPreviewDialogOpen(true)
      }
    } finally {
      setSending(false)
    }
  }

  function csvLinesToObjects(lines: string[]) {
    if (!lines || lines.length === 0) return []
    const headers = lines[0].split(',')
    return lines.slice(1).map((ln) => {
      const cols = ln.split(',')
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ''))
      return obj
    })
  }

  function downloadFile(filename: string, content: string, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function generateAndDownload() {
    setSending(true)
    setApiResult(null)
    try {
      const payload = fields.map(({ name, type, options }) => ({ name, type, options }))
      const api = await import('../api')
      await api.createTestDatas(payload, dataCnt, format, fileName)
    } catch (err: any) {
      setApiResult(err?.message ?? String(err))
    } finally {
      setSending(false)
    }
  }

  function formatOptionsSummary(type: string) {
    switch (type) {
      case 'String 데이터':
        return 'Min Length\nMax Length\n\n'
      case 'String 데이터 2':
        return '["example1","example2"]\n\n\n'
      case 'Number 데이터':
        return 'Min Value\nMax Value\nDecimal'
      case '라인 ID':
        return 'PFBF\nKFBN\nKFBK'
      case '제품 ID':
        return 'S5E0000A\nS4E0000K\nS4T0000A'
      case '스텝 ID':
        return 'VP000000\nAK000000\nCT000000'
      default:
        return '-'
    }
  }

  function handleSave() {
    if (onSave) {
      onSave(title, dataCnt, format, fields, fileName)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {isDialog ? (
        <Box sx={{ 
          p: 3, 
          borderBottom: '2px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Rule 설정
          </Typography>
          
          {/* 1. 설정 제목 */}
          <TextField
            label="Rule 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="설정 제목을 입력하세요"
            fullWidth
            size="small"
            sx={{ 
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'white',
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }
            }}
          />
          
          {/* 2. Data Count + Format + 스케줄링 */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Data Count"
              size="small"
              value={dataCnt}
              onChange={(e) => setDataCnt(Number(e.target.value || 0))}
              sx={{ 
                width: 160,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'white',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    borderWidth: 2,
                  },
                }
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                width: 160,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'white',
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    borderWidth: 2,
                  },
                }
              }}
            >
              <InputLabel id="format-label">Format</InputLabel>
              <Select 
                labelId="format-label"
                value={format} 
                label="Format" 
                onChange={(e) => setFormat(e.target.value as 'CSV' | 'JSON')}
              >
                <MenuItem value={'CSV'}>CSV</MenuItem>
                <MenuItem value={'JSON'} disabled>JSON (비활성화됨)</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    sx={{
                      color: '#667eea',
                      '&.Mui-checked': {
                        color: '#667eea',
                      },
                    }}
                  />
                }
                label="스케줄링 사용"
                sx={{ m: 0 }}
              />
              {scheduleEnabled && (
                <TextField
                  label="스케줄링"
                  size="small"
                  type="number"
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(Number(e.target.value || 1))}
                  inputProps={{ min: 1 }}
                  disabled={!scheduleEnabled}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Select
                          value={scheduleUnit}
                          onChange={(e) => setScheduleUnit(e.target.value as 'hour' | 'day')}
                          disabled={!scheduleEnabled}
                          sx={{
                            '& .MuiSelect-select': {
                              py: 0.5,
                              px: 1,
                              fontSize: '0.875rem',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: 'none',
                            },
                          }}
                        >
                          <MenuItem value={'hour'}>시간</MenuItem>
                          <MenuItem value={'day'}>일</MenuItem>
                        </Select>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    width: 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'white',
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2,
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(0, 0, 0, 0.05)',
                      },
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <div style={{ padding: 20 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>TestStreet3</Typography>
        </div>
      )}
      
      <Box sx={{ flex: 1, overflow: 'auto', p: isDialog ? 3 : 2 }}>
          {/* 파일명 설정 */}
          <TextField
            label="파일명"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="파일명을 입력하세요"
            fullWidth
            size="small"
            sx={{ 
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'white',
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }
            }}
          />

      <div>
        <TableContainer 
          component={Paper} 
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.08)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <MuiTable size="small">
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <TableCell sx={{ width: '30%', px: 2, py: 1.5, fontWeight: 700, color: '#1e293b' }}>Field Name</TableCell>
                <TableCell sx={{ width: '15%', px: 2, py: 1.5, fontWeight: 700, color: '#1e293b' }}>Type</TableCell>
                <TableCell sx={{ width: '45%', px: 2, py: 1.5, fontWeight: 700, color: '#1e293b' }}>Options</TableCell>
                <TableCell sx={{ width: '10%', px: 2, py: 1.5 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.id}>
                  <TableCell sx={{ px: 1 }}>
                    <TextField
                      value={f.name}
                      onChange={(e) => updateName(f.id, e.target.value)}
                      placeholder="Field name"
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell sx={{ px: 1 }}>
                      <Button variant="outlined" size="small" fullWidth onClick={() => { setDialogFieldId(f.id); setTypeDialogOpen(true); }}>
                        {f.type}
                      </Button>
                  </TableCell>
                  <TableCell sx={{ px: 1 }}>
                    {f.type === 'String 데이터' ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          label="Min"
                          size="small"
                          value={f.options?.minLength ?? 1}
                          onChange={(e) => updateOptions(f.id, { ...f.options, minLength: Number(e.target.value) || 1 })}
                          sx={{ width: 150 }}
                        />
                        <TextField
                          label="Max"
                          size="small"
                          value={f.options?.maxLength ?? 0}
                          onChange={(e) => updateOptions(f.id, { ...f.options, maxLength: Number(e.target.value) || 0 })}
                          sx={{ width: 150 }}
                        />
                      </Box>
                    ) : f.type === 'String 데이터 2' ? (
                      <TextField
                        label="문자열 배열"
                        size="small"
                        value={stringListInputs[f.id] !== undefined ? stringListInputs[f.id] : (f.options?.stringList ? JSON.stringify(f.options.stringList) : '')}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          // 입력 중인 값을 별도로 저장
                          setStringListInputs(prev => ({ ...prev, [f.id]: inputValue }))
                          
                          // 빈 문자열이면 undefined로 설정
                          if (inputValue === '') {
                            updateOptions(f.id, { ...f.options, stringList: undefined })
                            return
                          }
                          
                          try {
                            const parsed = JSON.parse(inputValue)
                            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                              updateOptions(f.id, { ...f.options, stringList: parsed })
                            }
                          } catch {
                            // JSON 파싱 실패 시 무시 (입력 중일 수 있음)
                          }
                        }}
                        onBlur={(e) => {
                          // 포커스를 잃을 때 입력값 정리
                          const inputValue = e.target.value
                          if (inputValue === '') {
                            setStringListInputs(prev => {
                              const newState = { ...prev }
                              delete newState[f.id]
                              return newState
                            })
                            return
                          }
                          try {
                            const parsed = JSON.parse(inputValue)
                            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
                              // 유효한 JSON이면 입력값 정리
                              setStringListInputs(prev => {
                                const newState = { ...prev }
                                delete newState[f.id]
                                return newState
                              })
                            }
                          } catch {
                            // 파싱 실패 시 입력값 유지
                          }
                        }}
                        placeholder='["example1","example2"]'
                        fullWidth
                        error={(() => {
                          const displayValue = stringListInputs[f.id] !== undefined ? stringListInputs[f.id] : (f.options?.stringList ? JSON.stringify(f.options.stringList) : '')
                          if (!displayValue) return false
                          try {
                            const parsed = JSON.parse(displayValue)
                            return !Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')
                          } catch {
                            return true
                          }
                        })()}
                      />
                    ) : f.type === 'Number 데이터' ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                          label="Min"
                          type="number"
                          size="small"
                          value={f.options?.minValue ?? 1}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 1 : Number(e.target.value)
                            updateOptions(f.id, { ...f.options, minValue: isNaN(val) ? 1 : val })
                          }}
                          sx={{ 
                            width: 150,
                            '& input[type=number]': {
                              MozAppearance: 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                        <TextField
                          label="Max"
                          type="number"
                          size="small"
                          value={f.options?.maxValue ?? 0}
                          onChange={(e) => updateOptions(f.id, { ...f.options, maxValue: Number(e.target.value) || 0 })}
                          sx={{ 
                            width: 150,
                            '& input[type=number]': {
                              MozAppearance: 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                        <TextField
                          label="Decimal"
                          type="number"
                          size="small"
                          value={f.options?.decimal ?? 0}
                          onChange={(e) => updateOptions(f.id, { ...f.options, decimal: Number(e.target.value) || 0 })}
                          sx={{ 
                            width: 150,
                            '& input[type=number]': {
                              MozAppearance: 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </Box>
                    ) : f.type === '라인 ID' || f.type === '제품 ID' ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={f.options?.setTitle ?? false}
                            onChange={(e) => updateOptions(f.id, { ...f.options, setTitle: e.target.checked })}
                            sx={{
                              color: '#667eea',
                              '&.Mui-checked': {
                                color: '#667eea',
                              },
                            }}
                          />
                        }
                        label="제목"
                        sx={{ m: 0 }}
                      />
                    ) : f.type === '스텝 ID' ? (
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                       <TextField
                          label="Pno"
                          size="small"
                          value={f.options?.pno ?? ''}
                          onChange={(e) => updateOptions(f.id, { ...f.options, pno: e.target.value })}
                          placeholder="Pno 입력"
                          sx={{ 
                            width: 150,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              '&:hover fieldset': {
                                borderColor: '#667eea',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                borderWidth: 2,
                              },
                            }
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={f.options?.setTitle ?? false}
                              onChange={(e) => updateOptions(f.id, { ...f.options, setTitle: e.target.checked })}
                              sx={{
                                color: '#667eea',
                                '&.Mui-checked': {
                                  color: '#667eea',
                                },
                              }}
                            />
                          }
                          label="제목"
                          sx={{ m: 0 }}
                        />
                      </Box>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ px: 2, py: 1.5 }}>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => removeField(f.id)}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2,
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </MuiTable>
        </TableContainer>
        </div>

        <Box sx={{ marginTop: 3, mb: 3, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          onClick={addField}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
              boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          + Add Field
        </Button>

        {!isDialog && (
          <>
            <Button 
              variant="outlined" 
              onClick={generateAndDownload} 
              disabled={sending}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5568d3',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {sending ? <CircularProgress size={18} /> : 'Generate Data'}
            </Button>

            <Button 
              variant="contained" 
              color="primary" 
              onClick={sendToApi} 
              disabled={sending}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {sending ? <CircularProgress size={18} /> : 'Preview'}
            </Button>
          </>
        )}
        
        {isDialog && (
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button 
              variant="contained" 
              onClick={sendToApi} 
              disabled={sending}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {sending ? <CircularProgress size={18} /> : 'Preview'}
            </Button>
          </Box>
        )}
      </Box>

      {!isDialog && (
        <Box sx={{ marginTop: 3 }}>
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Preview</Typography>

            {apiResult ? (
              <Typography color="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{apiResult}</Typography>
            ) : apiGrid ? (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  mt: 1,
                  maxHeight: 'calc(100vh - 400px)',
                  overflow: 'auto'
                }}
              >
                <MuiTable size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {apiGrid.headers.map((h, idx) => (
                        <TableCell key={idx} sx={{ fontWeight: 700, backgroundColor: 'background.paper' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apiGrid.rows.map((r, rIdx) => (
                      <TableRow key={rIdx}>
                        {r.map((c, cIdx) => (
                          <TableCell key={cIdx}>{c}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </MuiTable>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No result yet.</Typography>
            )}
          </Box>
        </Paper>
      </Box>
      )}
      
        <Dialog 
        open={typeDialogOpen} 
        onClose={() => { setTypeDialogOpen(false); setDialogFieldId(null); }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          pb: 2
        }}>
          Type 선택
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', height: 400, gap: 2 }}>
            {/* 좌측 사이드바 */}
            <Paper 
              variant="outlined" 
              sx={{ 
                width: 200, 
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                borderRadius: 2,
                background: 'rgba(248, 250, 252, 0.5)',
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <Button
                variant={selectedCategory === '기준정보' ? 'contained' : 'outlined'}
                fullWidth
                onClick={() => setSelectedCategory('기준정보')}
                sx={{ 
                  justifyContent: 'flex-start',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.25,
                  ...(selectedCategory === '기준정보' ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                    }
                  } : {
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'rgba(102, 126, 234, 0.05)',
                      color: '#667eea',
                    }
                  }),
                  transition: 'all 0.2s ease',
                }}
              >
                기준정보
              </Button>
              <Button
                variant={selectedCategory === '데이터' ? 'contained' : 'outlined'}
                fullWidth
                onClick={() => setSelectedCategory('데이터')}
                sx={{ 
                  justifyContent: 'flex-start',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.25,
                  ...(selectedCategory === '데이터' ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                    }
                  } : {
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'rgba(102, 126, 234, 0.05)',
                      color: '#667eea',
                    }
                  }),
                  transition: 'all 0.2s ease',
                }}
              >
                데이터
              </Button>
            </Paper>

            {/* 우측 카드 영역 */}  
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <Grid container spacing={2}>
                {selectedCategory === '기준정보' 
                  ? ['라인 ID', '제품 ID', '스텝 ID'].map((type) => (
                      <Grid item xs={12} sm={6} md={4} key={type}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'rgba(0, 0, 0, 0.08)',
                            background: 'white',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
                              transform: 'translateY(-4px)',
                              borderColor: '#667eea',
                            }
                          }}
                          onClick={() => { 
                            if (dialogFieldId) {
                              updateType(dialogFieldId, type)
                              setTypeDialogOpen(false)
                              setDialogFieldId(null)
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography 
                              variant="h6" 
                              component="div"
                              sx={{
                                fontWeight: 700,
                                color: '#1e293b',
                                mb: 1
                              }}
                            >
                              {type}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                mt: 1, 
                                whiteSpace: 'pre-line',
                                color: '#64748b',
                                fontSize: '0.8rem',
                                lineHeight: 1.6
                              }}
                            >
                              {formatOptionsSummary(type)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  : ['String 데이터', 'String 데이터 2', 'Number 데이터'].map((type) => (
                      <Grid item xs={12} sm={6} md={4} key={type}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'rgba(0, 0, 0, 0.08)',
                            background: 'white',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
                              transform: 'translateY(-4px)',
                              borderColor: '#667eea',
                            }
                          }}
                          onClick={() => { 
                            if (dialogFieldId) {
                              updateType(dialogFieldId, type)
                              setTypeDialogOpen(false)
                              setDialogFieldId(null)
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography 
                              variant="h6" 
                              component="div"
                              sx={{
                                fontWeight: 700,
                                color: '#1e293b',
                                mb: 1
                              }}
                            >
                              {type}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                mt: 1, 
                                whiteSpace: 'pre-line',
                                color: '#64748b',
                                fontSize: '0.8rem',
                                lineHeight: 1.6
                              }}
                            >
                              {formatOptionsSummary(type)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                }
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
          <Button 
            onClick={() => { setTypeDialogOpen(false); setDialogFieldId(null); }}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
              '&:hover': {
                background: 'rgba(100, 116, 139, 0.1)',
              }
            }}
          >
            취소
          </Button>
        </DialogActions>
        </Dialog>

      {isDialog && (
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '2px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          background: 'rgba(248, 250, 252, 0.5)',
          gap: 2
        }}>
          <Button 
            onClick={onClose}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
              '&:hover': {
                background: 'rgba(100, 116, 139, 0.1)',
              }
            }}
          >
            취소
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            저장
          </Button>
        </DialogActions>
      )}

      {/* Preview 다이얼로그 */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          pb: 2
        }}>
          Preview
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {previewFileName && (
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 2, 
                p: 1.5,
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: 1,
                fontWeight: 600,
                color: '#667eea'
              }}
            >
              파일명: {previewFileName || '(없음)'}
            </Typography>
          )}
          {apiResult ? (
            <Typography color="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{apiResult}</Typography>
          ) : apiGrid ? (
            <TableContainer 
              component={Paper} 
              sx={{ 
                mt: 1,
                maxHeight: 'calc(90vh - 200px)',
                overflow: 'auto',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <MuiTable size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    {apiGrid.headers.map((h, idx) => (
                      <TableCell key={idx} sx={{ fontWeight: 700, backgroundColor: 'background.paper', color: '#1e293b' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiGrid.rows.map((r, rIdx) => (
                    <TableRow 
                      key={rIdx}
                      sx={{
                        '&:hover': {
                          background: 'rgba(59, 130, 246, 0.03)',
                        },
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {r.map((c, cIdx) => (
                        <TableCell key={cIdx}>{c}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </MuiTable>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              데이터를 생성하려면 Preview 버튼을 클릭하세요.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'rgba(0, 0, 0, 0.08)' }}>
          <Button 
            onClick={() => setPreviewDialogOpen(false)}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b',
              '&:hover': {
                background: 'rgba(100, 116, 139, 0.1)',
              }
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  )
}
