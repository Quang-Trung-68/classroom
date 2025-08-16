import { Avatar, Box, Button, Chip, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import React, { memo, useCallback, useMemo } from "react";
import { Add, Logout, Person, PersonAdd, Settings } from "@mui/icons-material"
import { Home } from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import { useClassState } from "../../../stores/classStore";
import { useExamState } from "../../../stores/examStore";
import logo from "@/assets/images/logo.png"
import { useAuth, useAuthStore } from "../../../stores/authStore";
import { jwtDecode } from "jwt-decode";
import { ROUTES } from "../../../router/routes";
import { RoleI } from "../../../types/auth.types";

interface AccountMenuProps {
  onProfile: () => void;
  onLogout: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = memo(({ onProfile, onLogout }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleProfileClick = useCallback(() => {
    handleClose();
    onProfile();
  }, [onProfile, handleClose]);

  const handleLogoutClick = useCallback(() => {
    handleClose();
    onLogout();
  }, [onLogout, handleClose]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          p: 0.5,
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          T
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            borderRadius: 2,
            mt: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Person fontSize="large" />
          </ListItemIcon>
          <Typography fontSize="1.4rem" variant="body2">Profile</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <PersonAdd fontSize="large" />
          </ListItemIcon>
          <Typography fontSize="1.4rem" variant="body2">Add account</Typography>
        </MenuItem>

        <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Settings fontSize="large" />
          </ListItemIcon>
          <Typography fontSize="1.4rem" variant="body2">Settings</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogoutClick}
          sx={{
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'error.contrastText'
            }
          }}
        >
          <ListItemIcon>
            <Logout fontSize="large" sx={{ color: 'inherit' }} />
          </ListItemIcon>
          <Typography fontSize="1.4rem" variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
});

AccountMenu.displayName = 'AccountMenu';

const Header: React.FC = () => {
  const navigate = useNavigate();
  
  // Chỉ lấy những giá trị cần thiết từ store
  const classSelectingName = useClassState((state) => state.classSelecting?.name);
  const clearClass = useClassState((state) => state.clearClass);
  const clearClassState = useClassState((state) => state.clearClassState);
  const clearExamGroup = useExamState((state) => state.clearExamGroup);
  const clearExamState = useExamState((state) => state.clearExamState);
  const { logout } = useAuthStore();
  const { getAccessToken } = useAuth();

  // Memoize user info để tránh decode lại token không cần thiết
  const userInfo = useMemo(() => {
    try {
      return jwtDecode(getAccessToken());
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, [getAccessToken]);

  // Memoize derived values
  const isTeacher = useMemo(() => userInfo?.role === RoleI.TEACHER, [userInfo?.role]);
  const userRoleLabel = useMemo(() => isTeacher ? "Giáo viên" : "Học sinh", [isTeacher]);

  // Memoize callback functions
  const handleCreateClass = useCallback(() => {
    navigate(ROUTES.CREATE_CLASS);
  }, [navigate]);

  const handleGoHome = useCallback(() => {
    clearClass();
    clearExamGroup();
    navigate(ROUTES.CLASSES);
  }, [clearClass, clearExamGroup, navigate]);

  const handleProfile = useCallback(() => {
    navigate(ROUTES.PROFILE);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    clearClassState();
    clearExamState();
    navigate(ROUTES.LOGIN);
    logout();
  }, [clearClassState, clearExamState, navigate, logout]);

  // Memoize logo section
  const logoSection = useMemo(() => (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "start", gap: "10px" }}>
      <img width={"10%"} src={logo} alt="BK Classroom Logo" />
      <Box component={"span"}>BK Classroom</Box>
    </Box>
  ), []);

  if (!userInfo) {
    return null; // hoặc loading spinner
  }

  return (
    <header style={{ background: '#eee', padding: "10px 30px" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ fontWeight: "bold", fontSize: "2.4rem" }}>
          {classSelectingName || logoSection}
        </Box>
        
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          {isTeacher && (
            <Button 
              sx={{ fontSize: "1.4rem" }} 
              variant="outlined" 
              startIcon={<Add />} 
              onClick={handleCreateClass}
            >
              Tạo lớp
            </Button>
          )}
          
          <Button 
            sx={{ fontSize: "1.4rem" }} 
            startIcon={<Home />} 
            onClick={handleGoHome}
          >
            Trang chủ
          </Button>
          
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <AccountMenu onProfile={handleProfile} onLogout={handleLogout} />
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "start", 
              justifyContent: "center", 
              gap: "4px" 
            }}>
              <Chip 
                size="small" 
                variant="outlined" 
                sx={{ border: "none", fontWeight: "bolder", fontSize: "1.5rem" }} 
                color="primary" 
                label={userInfo.name} 
              />
              <Chip 
                size="small" 
                variant="outlined" 
                sx={{ fontSize: "1.3rem", fontWeight: "bold" }} 
                label={userRoleLabel} 
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </header>
  );
};

export default Header;