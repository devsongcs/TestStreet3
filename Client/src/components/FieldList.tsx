import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import FieldEditor from './FieldEditor'
import type { Field, FieldConfig } from '../types'
import { createTestDatas } from '../api'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function FieldList() {
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentTitle, setCurrentTitle] = useState<string>('')
  const [currentDataCnt, setCurrentDataCnt] = useState<number>(10)
  const [currentFormat, setCurrentFormat] = useState<'JSON' | 'CSV'>('JSON')
  const [currentFields, setCurrentFields] = useState<Field[]>([])
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null)
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  function handleAddNew() {
    setCurrentTitle('')
    setCurrentDataCnt(10)
    setCurrentFormat('JSON')
    setCurrentFields([
      { id: uid(), name: 'id', type: 'Number 데이터', options: { minValue: 1, maxValue: 100, decimal: 0 } },
      { id: uid(), name: 'name', type: 'String 데이터', options: { minLength: 1, maxLength: 10 } }
    ])
    setEditingIndex(null)
    setEditorOpen(true)
  }

  function handleEdit(index: number) {
    const config = fieldConfigs[index]
    setCurrentTitle(config.title)
    setCurrentDataCnt(config.dataCnt)
    setCurrentFormat(config.format)
    setCurrentFields(config.fields)
    setEditingIndex(index)
    setEditorOpen(true)
  }

  function handleDelete(index: number) {
    setFieldConfigs((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave(title: string, dataCnt: number, format: 'JSON' | 'CSV', fields: Field[]) {
    if (editingIndex !== null) {
      // 편집 모드
      setFieldConfigs((prev) => {
        const newConfigs = [...prev]
        newConfigs[editingIndex] = { title, dataCnt, format, fields }
        return newConfigs
      })
    } else {
      // 추가 모드
      setFieldConfigs((prev) => [...prev, { title, dataCnt, format, fields }])
    }
    setEditorOpen(false)
    setCurrentTitle('')
    setCurrentDataCnt(10)
    setCurrentFormat('JSON')
    setCurrentFields([])
    setEditingIndex(null)
  }

  async function handleGenerateData(index: number) {
    setGeneratingIndex(index)
    try {
      const config = fieldConfigs[index]
      const payload = config.fields.map(({ name, type, options }) => ({ name, type, options }))
      const res = await createTestDatas(payload, config.dataCnt, config.format)

      if (config.format === 'CSV') {
        const csv = typeof res === 'string' ? res : res?.csv ?? ''
        if (!csv) throw new Error('Empty CSV from API')
        downloadFile(`${config.title}-${Date.now()}.csv`, csv, 'text/csv')
      } else {
        if (Array.isArray(res)) {
          const headers = res[0].split(',')
          const rows = res.slice(1).map((ln) => ln.split(','))
          const objs = rows.map((row) => {
            const obj: Record<string, string> = {}
            headers.forEach((h, i) => (obj[h] = row[i] ?? ''))
            return obj
          })
          downloadFile(`${config.title}-${Date.now()}.json`, JSON.stringify(objs, null, 2), 'application/json')
        } else {
          downloadFile(`${config.title}-${Date.now()}.json`, JSON.stringify(res, null, 2), 'application/json')
        }
      }
    } catch (err: any) {
      alert(`오류: ${err?.message ?? String(err)}`)
    } finally {
      setGeneratingIndex(null)
    }
  }

  async function handlePreviewData(index: number) {
    setPreviewingIndex(index)
    setPreviewError(null)
    setPreviewData(null)
    try {
      const config = fieldConfigs[index]
      const payload = config.fields.map(({ name, type, options }) => ({ name, type, options }))
      const res = await createTestDatas(payload, config.dataCnt, 'JSON')

      // Backend returns IReadOnlyList<string> where first item is header CSV
      if (Array.isArray(res)) {
        const lines: string[] = res as string[]
        if (lines.length > 0) {
          const headers = lines[0].split(',')
          // Preview에서는 최대 100개까지만 표시
          const allRows = lines.slice(1).map((ln) => ln.split(','))
          const rows = allRows.slice(0, 100)
          setPreviewData({ headers, rows })
        } else {
          setPreviewData({ headers: [], rows: [] })
        }
      } else {
        setPreviewError(JSON.stringify(res, null, 2))
      }
      setPreviewDialogOpen(true)
    } catch (err: any) {
      setPreviewError(err?.message ?? String(err))
      setPreviewDialogOpen(true)
    } finally {
      setPreviewingIndex(null)
    }
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

  function formatOptionsSummary(type: string) {
    switch (type) {
      case 'String 데이터':
      case 'Number 데이터':
        return '-'
      case '라인 ID':
        return 'PFBF, KFBN, KFBK'
      case '제품 ID':
        return 'S5E0000A, S4E0000K, S4T0000A'
      case '스텝 ID':
        return 'VP000000, AK000000, CT000000'
      default:
        return '-'
    }
  }

  function handleClose() {
    setEditorOpen(false)
    setCurrentTitle('')
    setCurrentDataCnt(10)
    setCurrentFormat('JSON')
    setCurrentFields([])
    setEditingIndex(null)
  }

  return (
    <Box sx={{ 
      padding: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pb: 4
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5
            }}
          >
            TestStreet3
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            테스트 데이터 생성 도구
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
              boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          카드 추가
        </Button>
      </Box>

      {fieldConfigs.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 12,
          px: 3
        }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 3,
              mb: 3,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <AddIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.9)' }} />
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 2,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600
            }}
          >
            설정된 필드가 없습니다
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4,
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: 400,
              mx: 'auto'
            }}
          >
            카드 추가 버튼을 눌러 필드 설정을 시작하세요
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {fieldConfigs.map((config, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: 400, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5)',
                  }
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, p: 2.5 }}>
                  {/* 1. 설정 제목 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        flex: 1,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: '#1e293b',
                        lineHeight: 1.3
                      }}
                    >
                      {config.title || `설정 ${index + 1}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(index)}
                        sx={{ 
                          color: '#3b82f6',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.1)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(index)}
                        sx={{ 
                          color: '#ef4444',
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.1)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* 2. Data Count + Format */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    mb: 2, 
                    pb: 2, 
                    borderBottom: '2px solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)'
                  }}>
                    <TextField
                      label="Data Count"
                      size="small"
                      value={config.dataCnt}
                      disabled
                      sx={{ 
                        width: 110,
                        '& .MuiInputBase-root': {
                          background: 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 2,
                        }
                      }}
                    />
                    <FormControl 
                      size="small" 
                      sx={{ 
                        width: 110,
                        '& .MuiInputBase-root': {
                          background: 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 2,
                        }
                      }} 
                      disabled
                    >
                      <InputLabel id={`format-label-${index}`}>Format</InputLabel>
                      <Select 
                        labelId={`format-label-${index}`}
                        value={config.format} 
                        label="Format"
                      >
                        <MenuItem value={'JSON'}>JSON</MenuItem>
                        <MenuItem value={'CSV'}>CSV</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 3. 필드 설정 */}
                  <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 1.5, 
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#64748b'
                      }}
                    >
                      필드 요약
                    </Typography>
                    {config.fields.map((field) => (
                      <Box
                        key={field.id}
                        sx={{
                          p: 1.5,
                          mb: 1.5,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'rgba(148, 163, 184, 0.2)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                          {field.name || '(이름 없음)'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'inline-block',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            mb: 0.5
                          }}
                        >
                          {field.type}
                        </Typography>
                        {field.type === 'String 데이터' && field.options && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                            Min: {field.options.minLength ?? 1}, Max: {field.options.maxLength ?? 0}
                          </Typography>
                        )}
                        {field.type === 'Number 데이터' && field.options && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                            Min: {field.options.minValue ?? 1}, Max: {field.options.maxValue ?? 0}, Decimal: {field.options.decimal ?? 0}
                          </Typography>
                        )}
                        {formatOptionsSummary(field.type) !== '-' && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              mt: 1,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                              fontSize: '0.7rem',
                              fontWeight: 500
                            }}
                          >
                            예: {formatOptionsSummary(field.type)}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ 
                  p: 2, 
                  pt: 2,
                  borderTop: '2px solid',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  flexShrink: 0,
                  background: 'rgba(248, 250, 252, 0.5)',
                  display: 'flex',
                  gap: 1
                }}>
                  <Button
                    variant="contained"
                    onClick={() => handleGenerateData(index)}
                    disabled={generatingIndex === index}
                    sx={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 600,
                      py: 1.25,
                      borderRadius: 2,
                      boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.39)',
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a4190 100%)',
                        boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        opacity: 0.7,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {generatingIndex === index ? (
                      <CircularProgress size={18} sx={{ color: 'white' }} />
                    ) : (
                      'Generate Data'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handlePreviewData(index)}
                    disabled={previewingIndex === index}
                    sx={{
                      flex: 1,
                      borderColor: '#667eea',
                      color: '#667eea',
                      fontWeight: 600,
                      py: 1.25,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '&:hover': {
                        borderColor: '#5568d3',
                        background: 'rgba(102, 126, 234, 0.05)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        borderColor: '#667eea',
                        opacity: 0.7,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {previewingIndex === index ? (
                      <CircularProgress size={18} />
                    ) : (
                      'Preview'
                    )}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={editorOpen}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }
        }}
      >
        <FieldEditor
          initialTitle={currentTitle}
          initialDataCnt={currentDataCnt}
          initialFormat={currentFormat}
          initialFields={currentFields}
          onSave={handleSave}
          onClose={handleClose}
          isDialog={true}
        />
      </Dialog>

      {/* Preview 다이얼로그 */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false)
          setPreviewData(null)
          setPreviewError(null)
        }}
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
          {previewError ? (
            <Typography color="error" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{previewError}</Typography>
          ) : previewData ? (
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
                    {previewData.headers.map((h, idx) => (
                      <TableCell key={idx} sx={{ fontWeight: 700, backgroundColor: 'background.paper', color: '#1e293b' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.rows.map((r, rIdx) => (
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
            onClick={() => {
              setPreviewDialogOpen(false)
              setPreviewData(null)
              setPreviewError(null)
            }}
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
  )
}

