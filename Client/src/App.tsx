import React, { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import FieldList from './components/FieldList'
import ScheduleManager from './components/ScheduleManager'

type TabValue = 'rules' | 'schedule'

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabValue>('rules')

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: 1000,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              '&.Mui-selected': {
                color: '#ffffff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffffff',
              height: 3,
            },
          }}
        >
          <Tab label="룰 관리" value="rules" />
          <Tab label="스케줄 관리" value="schedule" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {currentTab === 'rules' && <FieldList />}
        {currentTab === 'schedule' && <ScheduleManager />}
      </Box>
    </Box>
  )
}
