import React, { useState, useEffect } from 'react'
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
  Container,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import FieldEditor from './FieldEditor'
import type { Field, FieldConfig } from '../types'
import { createTestDatas, createRule, previewTestData, getRules, deleteRule } from '../api'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function FieldList() {
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentTitle, setCurrentTitle] = useState<string>('')
  const [currentDataCnt, setCurrentDataCnt] = useState<number>(10)
  const [currentFormat, setCurrentFormat] = useState<'JSON' | 'CSV'>('CSV')
  const [currentFields, setCurrentFields] = useState<Field[]>([])
  const [currentFileName, setCurrentFileName] = useState<string>('')
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null)
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewFileName, setPreviewFileName] = useState<string>('')
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Backend DataType을 클라이언트 타입명으로 변환
  const DataTypeToKoreanMap: Record<number, string> = {
    0: '라인 ID', // StdLineId
    1: '제품 ID', // StdPartId
    2: '스텝 ID', // StdStepId
    3: 'String 데이터', // CustomDataToString
    4: 'String 데이터 2', // CustomDataToString2
    5: 'Number 데이터', // CustomDataToNumber
  }

  // CustomRule을 FieldConfig로 변환
  function convertRuleToFieldConfig(rule: any): FieldConfig {
    const fields: Field[] = rule.columns.map((col: any) => ({
      id: uid(),
      name: col.name,
      type: DataTypeToKoreanMap[col.dataType] || 'String 데이터',
      options: {
        setTitle: col.options?.useTitle || false,
        pno: col.options?.pno?.toString() || undefined,
        minLength: col.options?.minLength || undefined,
        maxLength: col.options?.maxLength || undefined,
        minValue: col.options?.minValue || undefined,
        maxValue: col.options?.maxValue || undefined,
        decimal: col.options?.decimal || undefined,
        stringList: col.options?.customValues || undefined,
      },
    }))

    return {
      id: rule.id,
      title: rule.title,
      dataCnt: rule.dataCount,
      format: rule.resultType === 0 ? 'CSV' : 'JSON',
      fields,
      fileName: rule.fileName,
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true)
        const rules = await getRules()
        const configs = rules.map((rule: any) => convertRuleToFieldConfig(rule))
        setFieldConfigs(configs)
      } catch (err: any) {
        console.error('Failed to load rules:', err)
        // 에러가 발생해도 빈 배열로 시작
        setFieldConfigs([])
      } finally {
        setLoading(false)
      }
    }

    loadRules()
  }, [])

  function handleAddNew() {
    setCurrentTitle('')
    setCurrentDataCnt(10)
    setCurrentFormat('CSV')
    setCurrentFields([
      { id: uid(), name: 'id', type: 'Number 데이터', options: { minValue: 1, maxValue: 100, decimal: 0 } },
      { id: uid(), name: 'name', type: 'String 데이터', options: { minLength: 1, maxLength: 10 } }
    ])
    setCurrentFileName('')
    setEditingIndex(null)
    setEditorOpen(true)
  }

  function handleEdit(index: number) {
    const config = fieldConfigs[index]
    setCurrentTitle(config.title)
    setCurrentDataCnt(config.dataCnt)
    setCurrentFormat(config.format)
    setCurrentFields(config.fields)
    setCurrentFileName(config.fileName || '')
    setEditingIndex(index)
    setEditorOpen(true)
  }

  async function handleDelete(index: number) {
    const config = fieldConfigs[index]
    
    // id가 없으면 로컬에서만 삭제 (새로 추가한 항목)
    if (!config.id) {
      setFieldConfigs((prev) => prev.filter((_, i) => i !== index))
      return
    }

    try {
      // API 호출하여 Rule 삭제
      await deleteRule(config.id)
      
      // 성공 시 로컬 상태에서도 삭제
      setFieldConfigs((prev) => prev.filter((_, i) => i !== index))
    } catch (err: any) {
      alert(`삭제 실패: ${err?.message ?? String(err)}`)
    }
  }

  async function handleSave(title: string, dataCnt: number, format: 'JSON' | 'CSV', fields: Field[], fileName: string) {
    try {
      // API 호출하여 Rule 생성
      await createRule({
        title,
        dataCount: dataCnt,
        resultType: format,
        fileName: fileName || `${title}.${format.toLowerCase()}`,
        columns: fields,
      })

      if (editingIndex !== null) {
        // 편집 모드
        setFieldConfigs((prev) => {
          const newConfigs = [...prev]
          newConfigs[editingIndex] = { title, dataCnt, format, fields, fileName }
          return newConfigs
        })
      } else {
        // 추가 모드
        setFieldConfigs((prev) => [...prev, { title, dataCnt, format, fields, fileName }])
      }
      setEditorOpen(false)
      setCurrentTitle('')
      setCurrentDataCnt(10)
      setCurrentFormat('CSV')
      setCurrentFields([])
      setCurrentFileName('')
      setEditingIndex(null)
    } catch (err: any) {
      alert(`저장 실패: ${err?.message ?? String(err)}`)
    }
  }

  async function handleGenerateData(index: number) {
    setGeneratingIndex(index)
    try {
      const config = fieldConfigs[index]
      const payload = config.fields.map(({ name, type, options }) => ({ name, type, options }))
      await createTestDatas(payload, config.dataCnt, config.format, config.fileName || '')
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
      const res = await previewTestData(payload, config.dataCnt, config.fileName || '')

      // Backend returns { fileName, dataSets } 형태
      const fileNameResult = res.fileName || ''
      const dataSets = res.dataSets || res

      setPreviewFileName(fileNameResult || '')

      // Backend returns IReadOnlyList<string> where first item is header CSV
      if (Array.isArray(dataSets)) {
        const lines: string[] = dataSets as string[]
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
        setPreviewError(JSON.stringify(dataSets, null, 2))
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
    setCurrentFormat('CSV')
    setCurrentFields([])
    setCurrentFileName('')
    setEditingIndex(null)
  }

  return (
    <Box sx={{ 
      padding: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundSize: '200% 200%',
      animation: 'gradientShift 15s ease infinite',
      '@keyframes gradientShift': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      pb: 4,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      {/* 메인 컨텐츠 */}
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        {/* 타이틀 및 카드 추가 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h4"
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

      {loading ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 12,
          px: 3,
          position: 'relative',
          zIndex: 1
        }}>
          <CircularProgress sx={{ color: '#ffffff', mb: 2 }} size={48} />
          <Typography sx={{ color: '#ffffff', fontWeight: 500, fontSize: '1.1rem' }}>
            데이터를 불러오는 중...
          </Typography>
        </Box>
      ) : fieldConfigs.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 12,
          px: 3,
          position: 'relative',
          zIndex: 1
        }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 4,
              mb: 3,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <AddIcon sx={{ fontSize: 56, color: 'rgba(255, 255, 255, 0.95)' }} />
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 2,
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 700,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}
          >
            아직 규칙이 없습니다
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4,
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: 500,
              mx: 'auto',
              fontSize: '1.1rem',
              lineHeight: 1.6
            }}
          >
            "새 규칙 추가" 버튼을 클릭하여 첫 번째 테스트 데이터 규칙을 만들어보세요
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
          {fieldConfigs.map((config, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  minHeight: 480,
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3), 0 8px 24px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, p: 3 }}>
                  {/* 헤더: 제목 + 액션 버튼 */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    mb: 2.5,
                    pb: 2,
                    borderBottom: '2px solid',
                    borderColor: 'rgba(102, 126, 234, 0.15)'
                  }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          mb: 0.5,
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {config.title || `규칙 ${index + 1}`}
                      </Typography>
                      {config.fileName && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#64748b',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5
                          }}
                        >
                          📄 {config.fileName}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(index)}
                        sx={{ 
                          color: '#3b82f6',
                          background: 'rgba(59, 130, 246, 0.08)',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.15)',
                            transform: 'scale(1.15) rotate(5deg)',
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
                          background: 'rgba(239, 68, 68, 0.08)',
                          '&:hover': {
                            background: 'rgba(239, 68, 68, 0.15)',
                            transform: 'scale(1.15) rotate(-5deg)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* 설정 정보: Data Count + Format */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    mb: 2.5,
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.06)'
                  }}>
                    <Box sx={{ 
                      flex: 1,
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        데이터 개수
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 700, mt: 0.5 }}>
                        {config.dataCnt.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      flex: 1,
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.15)'
                    }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        포맷
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 700, mt: 0.5 }}>
                        {config.format}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 필드 목록 */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 1.5, 
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#64748b',
                        flexShrink: 0
                      }}
                    >
                      필드 요약 ({config.fields.length}개)
                    </Typography>
                    <Box sx={{ 
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      maxHeight: '280px', // 처음 2개 필드만 보이도록 높이 제한
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(102, 126, 234, 0.3)',
                        borderRadius: '3px',
                        '&:hover': {
                          background: 'rgba(102, 126, 234, 0.5)',
                        },
                      },
                    }}>
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
          initialFileName={currentFileName}
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
          setPreviewFileName('')
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
      </Container>
    </Box>
    )
  }

