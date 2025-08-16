import React, { useState, useCallback } from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import type { LoginRequestI } from "../../../types/auth.types";
import type { LoginData } from "../../../utils/validation";

interface LoginFormProps {
    formData: LoginRequestI,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    formErrors: Partial<Record<keyof LoginData, string>>
}

const LoginForm: React.FC<LoginFormProps> = ({ formData, onChange, formErrors }) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleTogglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleMouseDownPassword = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    }, []);

    return (
        <Box>
            <TextField
                autoComplete="email"
                error={!!formErrors.email}
                helperText={formErrors.email}
                value={formData.email} 
                onChange={onChange} 
                name="email" 
                required 
                type="email" 
                fullWidth 
                label="Nhập email" 
                sx={{ mb: "20px" }}
                variant="outlined"
            />
            
            <TextField
                autoComplete="current-password"
                error={!!formErrors.password}
                helperText={formErrors.password}
                value={formData.password} 
                onChange={onChange} 
                name="password" 
                required 
                type={showPassword ? "text" : "password"}
                fullWidth 
                label="Nhập mật khẩu"
                variant="outlined"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleTogglePasswordVisibility}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                                size="large"
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                                    }
                                }}
                            >
                                {showPassword ? 
                                    <VisibilityOff fontSize="medium" /> : 
                                    <Visibility fontSize="medium" />
                                }
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
        </Box>
    );
};

export default LoginForm;