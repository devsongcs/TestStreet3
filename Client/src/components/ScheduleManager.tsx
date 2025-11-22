import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Container,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Chip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CancelIcon from '@mui/icons-material/Cancel'
import AddIcon from '@mui/icons-material/Add'
import { getRules } from '../api'
import type { FieldConfig } from '../types'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// Backend DataType을 클라이언트 타입명으로 변환
const DataTypeToKoreanMap: Record<number, string> = {
  0: '라인 ID',
  1: '제품 ID',
  2: '스텝 ID',
  3: 'String 데이터',
  4: 'String 데이터 2',
  5: 'Number 데이터',
}

// CustomRule을 FieldConfig로 변환
function convertRuleToFieldConfig(rule: any): FieldConfig {
  return {
    id: rule.id,
    title: rule.title,
    dataCnt: rule.dataCount,
    format: rule.resultType === 0 ? 'CSV' : 'JSON',
    fields: rule.columns.map((col: any) => ({
      id: uid(),
      name: col.name,
      type: DataTypeToKoreanMap[col.dataType] || 'String 데이터',
      options: {},
    })),
    fileName: rule.fileName,
  }
}

type ScheduleConfig = {
  id: string
  ruleIds: string[]
  enabled: boolean
  interval: number
  unit: 'hour' | 'day'
}

export default function ScheduleManager() {
  const [rules, setRules] = useState<FieldConfig[]>([])
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([])
  const [loading, setLoading] = useState(true)

  // 초기 데이터 로드
  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true)
        const rulesData = await getRules()
        const configs = rulesData.map((rule: any) => convertRuleToFieldConfig(rule))
        setRules(configs)
      } catch (err: any) {
        console.error('Failed to load rules:', err)
        setRules([])
      } finally {
        setLoading(false)
      }
    }

    loadRules()
  }, [])

  function handleAddSchedule() {
    const newSchedule: ScheduleConfig = {
      id: uid(),
      ruleIds: [],
      enabled: false,
      interval: 1,
      unit: 'hour',
    }
    setSchedules((prev) => [...prev, newSchedule])
  }

  function handleDeleteSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id))
  }

  function handleScheduleChange(id: string, updates: Partial<ScheduleConfig>) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, ...updates }
        }
        return s
      })
    )
  }

  function handleAddRule(scheduleId: string, ruleId: string) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId) {
          const currentRuleIds = s.ruleIds || []
          if (!currentRuleIds.includes(ruleId)) {
            return { ...s, ruleIds: [...currentRuleIds, ruleId] }
          }
        }
        return s
      })
    )
  }

  function handleRemoveRule(scheduleId: string, ruleId: string) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId) {
          return { ...s, ruleIds: (s.ruleIds || []).filter((id) => id !== ruleId) }
        }
        return s
      })
    )
  }

  return (
    <Box
      sx={{
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
          background:
            'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, position: 'relative', zIndex: 1 }}>
        {/* 헤더 */}
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
                mb: 0.5,
              }}
            >
              스케줄 관리
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              룰을 선택하여 자동 실행 스케줄을 설정하세요
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleAddSchedule}
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
            스케줄 추가
          </Button>
        </Box>

        {loading ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 12,
              px: 3,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CircularProgress sx={{ color: '#ffffff', mb: 2 }} size={48} />
            <Typography sx={{ color: '#ffffff', fontWeight: 500, fontSize: '1.1rem' }}>
              데이터를 불러오는 중...
            </Typography>
          </Box>
        ) : schedules.length === 0 ? (
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
              아직 스케줄이 없습니다
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
              "스케줄 추가" 버튼을 클릭하여 첫 번째 자동 실행 스케줄을 만들어보세요
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* 스케줄 목록 */}
            <Grid container spacing={3}>
              {schedules.map((schedule) => (
                  <Grid item xs={12} sm={6} md={4} key={schedule.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 4,
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-12px) scale(1.02)',
                          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3), 0 8px 24px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        {/* 헤더 */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, pb: 2, borderBottom: '2px solid', borderColor: 'rgba(102, 126, 234, 0.15)' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            스케줄 {schedules.indexOf(schedule) + 1}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSchedule(schedule.id)}
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

                        {/* 룰 선택 영역 */}
                        <Box sx={{ mb: 2.5 }}>
                          <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>
                            선택된 룰 ({(schedule.ruleIds || []).length}개)
                          </Typography>
                          
                          {/* 룰 추가 드롭다운 */}
                          {rules.filter((rule) => !(schedule.ruleIds || []).includes(rule.id || '')).length > 0 ? (
                            <FormControl fullWidth>
                              <InputLabel 
                                shrink={true}
                                sx={{ 
                                  '&.Mui-focused': {
                                    color: '#667eea',
                                  },
                                }}
                              >
                                추가 룰 선택
                              </InputLabel>
                              <Select
                                value={schedule.ruleIds.length > 0 ? 'has-values' : ''}
                                label="추가 룰 선택"
                                onChange={(e) => {
                                  const ruleId = e.target.value as string
                                  if (ruleId && ruleId !== 'has-values') {
                                    handleAddRule(schedule.id, ruleId)
                                  }
                                }}
                                displayEmpty
                                key={`select-${schedule.id}-${(schedule.ruleIds || []).length}`}
                                renderValue={(selected) => {
                                  // 빈 상태일 때는 빈 문자열 반환 (InputLabel만 표시)
                                  if (!selected || selected === '' || schedule.ruleIds.length === 0) {
                                    return ''
                                  }
                                  // Chip이 있을 때만 Chip들을 표시
                                  return (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {schedule.ruleIds.map((ruleId) => {
                                        const rule = rules.find((r) => r.id === ruleId)
                                        if (!rule) return null
                                        return (
                                          <Chip
                                            key={ruleId}
                                            label={rule.title}
                                            onDelete={(e) => {
                                              e.stopPropagation()
                                              handleRemoveRule(schedule.id, ruleId)
                                            }}
                                            deleteIcon={<CancelIcon />}
                                            size="small"
                                            sx={{
                                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                              border: '1px solid rgba(102, 126, 234, 0.3)',
                                              fontWeight: 600,
                                              fontSize: '0.75rem',
                                              height: '24px',
                                              '&:hover': {
                                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                              },
                                              '& .MuiChip-deleteIcon': {
                                                fontSize: '16px',
                                              },
                                            }}
                                          />
                                        )
                                      })}
                                    </Box>
                                  )
                                }}
                                sx={{
                                  '& .MuiSelect-icon': {
                                    display: 'none',
                                  },
                                  '& .MuiSelect-select': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    minHeight: schedule.ruleIds.length === 0 ? '56px' : 'auto',
                                    padding: schedule.ruleIds.length > 0 ? '8px 14px' : '16.5px 14px',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: schedule.ruleIds.length === 0 ? 'rgba(102, 126, 234, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#667eea',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#667eea',
                                    borderWidth: 2,
                                  },
                                  background: schedule.ruleIds.length === 0 
                                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)'
                                    : 'transparent',
                                  borderRadius: 2,
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      maxHeight: 300,
                                    },
                                  },
                                }}
                              >
                                {rules
                                  .filter((rule) => !(schedule.ruleIds || []).includes(rule.id || ''))
                                  .map((rule) => (
                                    <MenuItem key={rule.id} value={rule.id || ''}>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {rule.title}
                                        </Typography>
                                        {rule.fileName && (
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {rule.fileName}
                                          </Typography>
                                        )}
                                      </Box>
                                    </MenuItem>
                                  ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Box sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              background: 'rgba(102, 126, 234, 0.05)',
                              border: '1px solid rgba(102, 126, 234, 0.2)',
                              textAlign: 'center'
                            }}>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                모든 룰이 선택되었습니다
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Interval 및 단위 */}
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <TextField
                            label="Interval"
                            type="number"
                            value={schedule.interval}
                            onChange={(e) =>
                              handleScheduleChange(schedule.id, { interval: Number(e.target.value) || 1 })
                            }
                            fullWidth
                            inputProps={{ min: 1 }}
                            sx={{
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
                          <FormControl fullWidth>
                            <InputLabel>단위</InputLabel>
                            <Select
                              value={schedule.unit}
                              label="단위"
                              onChange={(e) =>
                                handleScheduleChange(schedule.id, { unit: e.target.value as 'hour' | 'day' })
                              }
                              sx={{
                                '& .MuiSelect-icon': {
                                  display: 'none',
                                },
                              }}
                            >
                              <MenuItem value="hour">시간</MenuItem>
                              <MenuItem value="day">일</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        {/* 활성화 체크박스 */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={schedule.enabled}
                              onChange={(e) => handleScheduleChange(schedule.id, { enabled: e.target.checked })}
                              sx={{
                                color: '#667eea',
                                '&.Mui-checked': {
                                  color: '#667eea',
                                },
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              스케줄 활성화
                            </Typography>
                          }
                          sx={{ mt: 'auto' }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  )
}

