import React, { useState, useCallback } from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import type { RegisterFields } from "../../../utils/validation";

interface RegisterFormProps {
    formFields: RegisterFields,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    formErrors: Partial<Record<keyof RegisterFields, string>>,
}

const RegisterForm: React.FC<RegisterFormProps> = ({ formFields, formErrors, onChange }) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // Toggle functions for password visibility
    const handleTogglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleToggleConfirmPasswordVisibility = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    // Prevent mouse down event to avoid losing focus
    const handleMouseDownPassword = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    }, []);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <TextField
                autoComplete="name"
                error={!!formErrors.name}
                helperText={formErrors.name}
                value={formFields.name} 
                onChange={onChange} 
                name="name" 
                required 
                fullWidth 
                label="Tên của bạn"
                variant="outlined"
            />
            
            <TextField
                autoComplete="email"
                error={!!formErrors.email}
                helperText={formErrors.email}
                value={formFields.email} 
                onChange={onChange} 
                name="email" 
                required 
                type="email" 
                fullWidth 
                label="Địa chỉ email"
                variant="outlined"
            />
            
            <TextField
                autoComplete="new-password"
                error={!!formErrors.password}
                helperText={formErrors.password}
                value={formFields.password} 
                onChange={onChange} 
                name="password" 
                required 
                type={showPassword ? "text" : "password"}
                fullWidth 
                label="Mật khẩu"
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
            
            <TextField
                autoComplete="new-password"
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                value={formFields.confirmPassword} 
                onChange={onChange} 
                name="confirmPassword" 
                required 
                type={showConfirmPassword ? "text" : "password"}
                fullWidth 
                label="Nhập lại mật khẩu"
                variant="outlined"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={handleToggleConfirmPasswordVisibility}
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
                                {showConfirmPassword ? 
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

export default RegisterForm;