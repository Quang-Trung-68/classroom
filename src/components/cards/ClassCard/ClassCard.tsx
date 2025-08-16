import { Box, Button, Chip } from "@mui/material"
import GoClass from '@mui/icons-material/Login';
import ShareIcon from '@mui/icons-material/Share';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from "react-router-dom";
import { memo, useCallback } from "react";
import type { ClassI } from "../../../types/classes.types";
import { generateRoutes } from "../../../router/routes";

interface ClassCardProps {
    classElement: ClassI
}

const ClassCard: React.FC<ClassCardProps> = memo(({ classElement }) => {
    const navigate = useNavigate()

    // Memoize callback functions để tránh re-render không cần thiết
    const handleGoToClass = useCallback(() => {
        navigate(generateRoutes.classDetail(classElement.id))
    }, [navigate, classElement.id])

    const handleShare = useCallback(() => {
        // Thêm logic chia sẻ ở đây nếu cần
        console.log('Share class:', classElement.code)
    }, [classElement.code])

    return (
        <Box sx={{
            background: 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)',
            borderRadius: 3,
            padding: 2,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height:"100%"
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 2
            }}>
                <Box sx={{
                    fontWeight: 700,
                    fontSize: '2.4rem',
                    lineHeight: 1.2,
                    flex: 1,
                    mr: 2
                }}>
                    {classElement.name}
                </Box>

                <Button
                    onClick={handleGoToClass}
                    variant="contained"
                    size="small"
                    startIcon={<GoClass />}
                    sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.4rem',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.3)'
                        }
                    }}
                >
                    Vào lớp
                </Button>
            </Box>

            {/* Member Count */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
            }}>
                <PeopleIcon sx={{ fontSize: '3rem' }} />
                <Box>
                    <Box sx={{
                        fontSize: '3rem',
                        fontWeight: 700,
                        lineHeight: 1
                    }}>
                        {classElement.users.length}
                    </Box>
                    <Box sx={{
                        fontSize: '1.6rem',
                        opacity: 0.9
                    }}>
                        Thành viên
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Chip
                    label={`Mã lớp học: ${classElement.code}`}
                    size="medium"
                    sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        fontSize: "1.4rem"
                    }}
                />

                <Button
                    onClick={handleShare}
                    variant="text"
                    size="small"
                    startIcon={<ShareIcon />}
                    sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.4rem',
                        textTransform: 'none',
                        minWidth: 'auto',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    Chia sẻ
                </Button>
            </Box>
        </Box>
    )
})

// Đặt displayName cho component để dễ debug
ClassCard.displayName = 'ClassCard'

export default ClassCard;