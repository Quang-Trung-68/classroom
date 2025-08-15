import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useLoadingStore } from '../../../stores/loadingStore';

const GlobalLoader: React.FC = () => {
  const { isLoading, loadingMessage } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <Box
  sx={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
  }}
>
  <LinearProgress 
    sx={{
      height: '4px',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      '& .MuiLinearProgress-bar': {
        background: 'linear-gradient(90deg, #3b82f6, #1d4ed8, #2563eb)',
        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
        transition: 'all 1.0s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          animation: 'smoothFlow 4s ease-in-out infinite',
        }
      },
      '@keyframes smoothFlow': {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(200%)' },
      }
    }}
  />
  {loadingMessage && (
    <Box sx={{ p: 2.5, textAlign: 'center' }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#1d4ed8', 
          fontWeight: 500,
          fontSize: '0.875rem',
          letterSpacing: '0.3px'
        }}
      >
        {loadingMessage}
      </Typography>
    </Box>
  )}
</Box>
  );
};

export default GlobalLoader;