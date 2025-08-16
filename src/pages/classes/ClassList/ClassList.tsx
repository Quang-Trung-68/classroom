import { Button, Grid, InputAdornment, TextField, Box, Typography } from "@mui/material";
import ClassCard from "../../../components/cards/ClassCard/ClassCard";
import { Add } from "@mui/icons-material";
import { Search } from "@mui/icons-material";
import { Outlet, useNavigate } from "react-router-dom";
import { useClassState } from "../../../stores/classStore";
import { useEffect, useState, useMemo, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../../stores/authStore";
import { ROUTES } from "../../../router/routes";
import { RoleI } from "../../../types/auth.types";
import { useDebounce } from "../../../hooks/useDebounce";

const ClassList: React.FC = () => {
    const { classes, getClasses, clearClass } = useClassState();
    const { getAccessToken } = useAuth()
    const info = useMemo(() => jwtDecode(getAccessToken()), [getAccessToken])
    const navigate = useNavigate()

    // State cho search
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Debounce search term với delay 400ms
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    useEffect(() => {
        clearClass()
        getClasses();
    }, [clearClass, getClasses]);

    // Lọc classes dựa trên search term
    const filteredClasses = useMemo(() => {
        console.log(classes)
        if (!debouncedSearchTerm.trim()) {
            return classes;
        }

        const searchLower = debouncedSearchTerm.toLowerCase().trim();
        return classes.filter((classElement) =>
            classElement.name?.toLowerCase().includes(searchLower) ||
            classElement.code?.toLowerCase().includes(searchLower)
        );
    }, [classes, debouncedSearchTerm]);

    // Memoize callback functions
    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }, []);

    const handleCreateClass = useCallback(() => {
        navigate(ROUTES.CREATE_CLASS);
    }, [navigate]);

    // Check if user is teacher
    const isTeacher = useMemo(() => info.role === RoleI.TEACHER, [info.role]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 4,
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box sx={{
                    fontWeight: "bold",
                    fontSize: "2.4rem",
                    color: "#1a1a1a",
                    flex: 1,
                    minWidth: '300px'
                }}>
                    DANH SÁCH LỚP HỌC
                </Box>

                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flex: 1,
                    justifyContent: 'flex-end',
                    minWidth: '400px'
                }}>
                    <TextField
                        placeholder="Tìm kiếm lớp học..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{
                            minWidth: '200px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: '#f8f9fa',
                                '& fieldset': {
                                    borderColor: '#e0e0e0'
                                },
                                '&:hover fieldset': {
                                    borderColor: '#1976d2'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#1976d2'
                                }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#666' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {isTeacher && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={{
                                fontSize: "1.4rem",
                                fontWeight: 600,
                                px: 3,
                                py: 1.2,
                                borderRadius: 2,
                                textTransform: 'none',
                                backgroundColor: '#1976d2',
                                '&:hover': {
                                    backgroundColor: '#1565c0'
                                }
                            }}
                            onClick={handleCreateClass}
                        >
                            Thêm lớp
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Search Results Info */}
            {debouncedSearchTerm && (
                <Box sx={{ mb: 2 }}>
                    <Typography fontSize={"1.5rem"} variant="body2" color="text.secondary">
                        {filteredClasses.length > 0
                            ? `Tìm thấy ${filteredClasses.length} lớp học cho "${debouncedSearchTerm}"`
                            : `Không tìm thấy kết quả cho "${debouncedSearchTerm}"`
                        }
                    </Typography>
                </Box>
            )}

            {/* Classes Grid */}
            <Grid container spacing={3}>
                {filteredClasses.length > 0 ? (
                    filteredClasses.map((classElement) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={classElement.id}>
                            <ClassCard classElement={classElement} />
                        </Grid>
                    ))
                ) : (
                    <Grid size={12}>
                        <Box sx={{
                            textAlign: 'center',
                            py: 8,
                            color: '#666'
                        }}>
                            <Typography variant="h6" fontSize={"1.4rem"} sx={{ mb: 1 }}>
                                {debouncedSearchTerm
                                    ? "Không tìm thấy lớp học nào"
                                    : "Bạn chưa có lớp học nào."
                                }
                            </Typography>
                            {debouncedSearchTerm && (
                                <Typography variant="body2" fontSize={"1.4rem"} color="text.secondary">
                                    Thử tìm kiếm với từ khóa khác
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                )}
            </Grid>

            <Outlet />
        </Box>
    )
}

export default ClassList;