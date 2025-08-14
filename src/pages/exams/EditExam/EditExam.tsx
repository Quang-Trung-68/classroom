import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Box, Button, Grid, TextField, Breadcrumbs, Link, Typography, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import AnsweringCard from "../../../components/cards/AnsweringCard/AnsweringCard";
import { useExamState } from "../../../stores/examStore";
import { useNavigate, useParams } from "react-router-dom";
import { generateRoutes } from "../../../router/routes";

const RenderQuestions = memo(({ count, onQuestionsChange, questionsData }) => {
    return (
        <>
            {Array.from({ length: count }, (_, index) => (
                <AnsweringCard
                    key={index}
                    questionIndex={index}
                    onQuestionChange={onQuestionsChange}
                    initialData={questionsData[index] || null}
                />
            ))}
        </>
    );
});

 {/* Component con để render preview content */ }
    const FilePreviewContent = memo(({ previewUrl, selectedFile, canPreviewFile }) => {
        if (previewUrl) {
            const isPDF = previewUrl.startsWith('data:application/pdf');

            return (
                <Box sx={{ width: '100%', height: '100%' }}>
                    {isPDF ? (
                        <object
                            data={previewUrl}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                        >
                            <iframe
                                src={previewUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title="File Preview"
                            />
                        </object>
                    ) : (
                        <iframe
                            src={previewUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                            title="File Preview"
                        />
                    )}
                </Box>
            );
        }

        if (selectedFile) {
            return (
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    p: 3
                }}>
                    <FileUploadIcon sx={{ fontSize: 64, opacity: 0.4, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        {canPreviewFile() ? "Đang tải preview..." : "Không thể xem trước"}
                    </Typography>
                    <Typography variant="body2" textAlign="center">
                        {canPreviewFile()
                            ? "Vui lòng chờ trong giây lát"
                            : "File này không hỗ trợ xem trước trực tiếp. Bạn có thể tải xuống để xem."
                        }
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
                p: 3
            }}>
                <FileUploadIcon sx={{ fontSize: 80, opacity: 0.2, mb: 2 }} />
                <Typography variant="h5" gutterBottom color="text.secondary">
                    Chưa có file đề bài
                </Typography>
                <Typography variant="body1" textAlign="center" color="text.secondary">
                    Nhấn nút "Tải lên file đề bài" để thêm file
                </Typography>
            </Box>
        );
    })

const EditExam = () => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const { examSelecting, getExamDetail, examDetail, putExamDetail, clearExamState } = useExamState();
    const navigate = useNavigate();
    const { id, exam_group_id, exam_id } = useParams();

    // Default form data structure
    const defaultExamData = useMemo(() => ({
        exam_group: Number(examSelecting?.id || 0),
        description: "default",
        name: "",
        code: "",
        total_time: 0,
        number_of_question: 1,
        questions: [],
        file: {
            id: null,
            url: "",
            payload: ""
        }
    }), [examSelecting?.id]);

    // State cho form data với giá trị mặc định
    const [examData, setExamData] = useState(defaultExamData);

    // Helper function để lấy file type từ tên file
    const getFileTypeFromName = useCallback((fileName) => {
        if (!fileName) return 'unknown';
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'application/pdf';
            case 'doc':
                return 'application/msword';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'txt':
                return 'text/plain';
            default:
                return 'unknown';
        }
    }, []);

    // Helper để lấy file type cho preview
    const getFileTypeForPreview = useCallback(() => {
        if (selectedFile?.isFromServer && examData.file.url) {
            return getFileTypeFromName(examData.file.url);
        }
        return selectedFile?.type || "";
    }, [selectedFile, examData.file.url, getFileTypeFromName]);

    // Check xem có thể preview file không
    const canPreviewFile = useCallback(() => {
        const type = getFileTypeForPreview();
        if (examData.file.url && !examData.file.payload) {
            return true;
        } else if (examData.file.payload) {
            return type === "application/pdf" || type === "text/plain";
        }
        return false;
    }, [examData.file, getFileTypeForPreview]);

    // Function để cập nhật preview URL
    const updatePreviewUrl = useCallback(() => {
        if (!selectedFile) {
            setPreviewUrl("");
            return;
        }

        let urlToPreview = "";
        const type = getFileTypeForPreview();

        if (examData.file.payload) {
            if (type === "application/pdf") {
                urlToPreview = examData.file.payload;
            } else if (type === "text/plain") {
                try {
                    const base64Data = examData.file.payload.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'text/plain' });
                    urlToPreview = URL.createObjectURL(blob);
                } catch (error) {
                    console.error("Error creating text preview:", error);
                    urlToPreview = "";
                }
            }
        } else if (examData.file.url) {
            if (type === "application/pdf" || type === "text/plain") {
                urlToPreview = examData.file.url;
            } else {
                urlToPreview = `https://docs.google.com/viewer?url=${encodeURIComponent(examData.file.url)}&embedded=true`;
            }
        }

        setPreviewUrl(urlToPreview);
    }, [selectedFile, examData.file, getFileTypeForPreview]);

    // Effect chính để load data khi component mount hoặc exam_id thay đổi
    useEffect(() => {
        const loadExamData = async () => {
            if (!exam_id) return;

            console.log("Loading exam data for ID:", exam_id);
            setIsLoading(true);
            setInitialLoadComplete(false);

            try {
                // Reset về trạng thái ban đầu
                setExamData(defaultExamData);
                setSelectedFile(null);
                setPreviewUrl("");
                clearExamState?.();

                // Fetch data từ server
                await getExamDetail(Number(exam_id));

            } catch (error) {
                console.error("Error loading exam data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadExamData();
    }, [exam_id, defaultExamData, getExamDetail, clearExamState]);

    // Effect để cập nhật state khi có data từ server
    useEffect(() => {
        if (examDetail?.id && String(examDetail.id) === String(exam_id) && !initialLoadComplete) {
            console.log("Processing exam detail data:", examDetail);

            // Format questions data
            const formattedQuestions = examDetail.questions?.map((q, index) => ({
                id: q.id || null,
                index: q.index !== undefined ? q.index : index,
                type: q.type || 'single-choice',
                question: q.question || '',
                correct_answer: q.correct_answer || ''
            })) || [];

            // Tạo data mới
            const newExamData = {
                id: examDetail.id,
                exam_group: examDetail.exam_group || Number(examSelecting?.id || 0),
                description: examDetail.description || "default",
                name: examDetail.name || "",
                code: examDetail.code || "",
                total_time: examDetail.total_time || 0,
                number_of_question: examDetail.number_of_question || 1,
                questions: formattedQuestions,
                file: {
                    id: examDetail.file?.id || null,
                    url: examDetail.file?.url || "",
                    payload: ""
                }
            };

            // Update state một lần duy nhất
            setExamData(newExamData);

            // Setup file nếu có
            if (examDetail.file?.key || examDetail.file?.url) {
                const fileName = examDetail.file.key?.split('/').pop() || 'Uploaded file';
                const mockFile = {
                    name: fileName,
                    size: 0,
                    type: getFileTypeFromName(fileName),
                    isFromServer: true
                };
                setSelectedFile(mockFile);
            }

            setInitialLoadComplete(true);
            console.log("Exam data loaded successfully");
        }
    }, [examDetail, exam_id, examSelecting?.id, initialLoadComplete, getFileTypeFromName]);

    // Effect để update preview URL
    useEffect(() => {
        if (initialLoadComplete) {
            updatePreviewUrl();
        }
    }, [examData.file, selectedFile, updatePreviewUrl, initialLoadComplete]);

    // Cleanup effect cho preview URL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Event handlers
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            handleFileUpload(file);
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (file) => {
        try {
            if (file.size > 10 * 1024 * 1024) {
                alert("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.");
                setSelectedFile(null);
                return;
            }

            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert("Định dạng file không được hỗ trợ!");
                setSelectedFile(null);
                return;
            }

            const base64String = await fileToBase64(file);

            setExamData(prev => ({
                ...prev,
                file: {
                    id: null,
                    url: "",
                    payload: base64String
                }
            }));

            

        } catch (error) {
            console.error("Error processing file:", error);
            alert("Có lỗi xảy ra khi xử lý file!");
            setSelectedFile(null);
            setExamData(prev => ({
                ...prev,
                file: {
                    ...prev.file,
                    payload: ""
                }
            }));
        }
    };

    const handleInputChange = (field) => (event) => {
        let value = event.target.value;

        if (field === 'number_of_question') {
            value = Math.max(1, parseInt(value) || 1);
        } else if (field === 'total_time') {
            value = Math.max(0, parseInt(value) || 0);
        }

        setExamData(prev => {
            const newData = { ...prev, [field]: value };

            // Điều chỉnh số câu hỏi nếu cần
            if (field === 'number_of_question') {
                const currentQuestions = prev.questions || [];
                const newQuestions = Array(value).fill(null).map((_, index) => {
                    return currentQuestions[index] || {
                        index,
                        type: 'single-choice',
                        question: '',
                        correct_answer: ''
                    };
                });
                newData.questions = newQuestions;
            }

            return newData;
        });
    };

    const handleQuestionsChange = useCallback((questionIndex, questionData) => {
        setExamData(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[questionIndex] = {
                ...newQuestions[questionIndex],
                index: questionIndex,
                ...questionData
            };

            return {
                ...prev,
                questions: newQuestions
            };
        });
    }, []);

    const handleUpdateExam = async () => {
        if (!examData.name.trim() || !examData.code.trim()) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        setIsLoading(true);

        try {
            await putExamDetail(Number(exam_id), examData);
            clearExamState();
            navigate(generateRoutes.examDetail(id, exam_group_id));
        } catch (error) {
            console.error("Error updating exam:", error);
            alert("Có lỗi xảy ra khi cập nhật đề bài!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFile = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setPreviewUrl("");

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        setExamData(prev => ({
            ...prev,
            file: {
                id: null,
                url: "",
                payload: ""
            }
        }));
    };

    const handleOpenPreviewDialog = () => {
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
    };

    const handleDownloadFile = () => {
        if (examData.file.payload) {
            const link = document.createElement('a');
            link.href = examData.file.payload;
            link.download = selectedFile?.name || 'file';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (examData.file.url) {
            window.open(examData.file.url, '_blank');
        }
    };

    // Render loading state chỉ khi thực sự đang tải
    if (!initialLoadComplete && isLoading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                flexDirection: 'column',
                gap: 2
            }}>
                <Typography variant="h6">Đang tải dữ liệu...</Typography>
                <Typography variant="body2" color="text.secondary">
                    Vui lòng chờ trong giây lát
                </Typography>
            </Box>
        );
    }

   

    return (
        <>
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link
                    underline="hover"
                    color="inherit"
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(-1)}
                    fontSize={"1.6rem"}
                    fontWeight={"bold"}
                >
                    Danh sách bài thi
                </Link>
                <Typography fontWeight={"bold"} color="primary" fontSize={"1.6rem"}>
                    Sửa bài thi
                </Typography>
            </Breadcrumbs>

            <Grid container spacing={4} sx={{ alignItems: "start", justifyContent: "space-between" }}>
                {/* Phần Preview bên trái */}
                <Grid size={6}>
                    <Box sx={{
                        height: '80vh',
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Header Section */}
                        <Box sx={{
                            p: 2,
                            borderBottom: '1px solid #ddd',
                            backgroundColor: '#fafafa'
                        }}>
                            <Button
                                onClick={handleUploadClick}
                                startIcon={<FileUploadIcon />}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    textTransform: "none",
                                    mb: selectedFile ? 2 : 0
                                }}
                                disabled={isLoading}
                            >
                                {selectedFile ? 'Thay đổi file' : 'Tải lên file đề bài'}
                            </Button>

                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt"
                            />

                            {/* File Info */}
                            {selectedFile && (
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 1,
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, fontSize: "1.2rem" }}>
                                        {selectedFile.name}
                                        {selectedFile.isFromServer && (
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                color="primary"
                                                sx={{ ml: 1, fontStyle: 'italic', fontSize: "1.2rem" }}
                                            >
                                                (Từ server)
                                            </Typography>
                                        )}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {selectedFile.type}
                                        {selectedFile.size > 0 && ` • ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                                    </Typography>

                                    {/* Action Buttons */}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                        {canPreviewFile() && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={handleOpenPreviewDialog}
                                                startIcon={<VisibilityIcon />}
                                                sx={{ textTransform: "none", fontSize: '1.2rem' }}
                                            >
                                                Xem toàn màn hình
                                            </Button>
                                        )}

                                        {(examData.file.payload || examData.file.url) && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={handleDownloadFile}
                                                sx={{ textTransform: "none", fontSize: '1.2rem' }}
                                            >
                                                Tải xuống
                                            </Button>
                                        )}

                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={handleRemoveFile}
                                            sx={{ textTransform: "none", fontSize: '1.2rem' }}
                                        >
                                            Xóa
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Preview Content */}
                        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <FilePreviewContent
                                previewUrl={previewUrl}
                                selectedFile={selectedFile}
                                canPreviewFile={canPreviewFile}
                            />
                        </Box>
                    </Box>
                </Grid>

                {/* Phần form bên phải */}
                <Grid size={6} container>
                    <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
                        <Box>Tên đề *</Box>
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                required
                                label="Nhập tên đề"
                                value={examData.name || ""}
                                onChange={handleInputChange('name')}
                                disabled={isLoading}
                            />
                        </Box>
                    </Grid>

                    <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
                        <Box>Mã đề *</Box>
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                required
                                label="Nhập mã đề"
                                value={examData.code || ""}
                                onChange={handleInputChange('code')}
                                disabled={isLoading}
                            />
                        </Box>
                    </Grid>

                    <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
                        <Box>Thời gian làm bài(phút) *</Box>
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                required
                                type="number"
                                label="Nhập thời gian"
                                value={examData.total_time || 0}
                                onChange={handleInputChange('total_time')}
                                inputProps={{
                                    min: 1,
                                    max: 300
                                }}
                                disabled={isLoading}
                            />
                        </Box>
                    </Grid>

                    <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
                        <Box>Số câu *</Box>
                        <Box>
                            <TextField
                                type="number"
                                inputProps={{
                                    min: 1,
                                    max: 100,
                                    step: 1,
                                }}
                                fullWidth
                                size="small"
                                required
                                label="Nhập số câu"
                                value={examData.number_of_question || 1}
                                onChange={handleInputChange('number_of_question')}
                                disabled={isLoading}
                            />
                        </Box>
                    </Grid>

                    <Grid container size={12}>
                        <RenderQuestions
                            count={examData.number_of_question || 1}
                            onQuestionsChange={handleQuestionsChange}
                            questionsData={examData.questions || []}
                        />
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Button
                                variant="contained"
                                onClick={handleUpdateExam}
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang cập nhật..." : "Cập nhật đề bài"}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>

            <Dialog
                open={previewOpen}
                onClose={handleClosePreview}
                maxWidth="lg"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>
                    Xem trước file: {selectedFile?.name}
                    <IconButton
                        aria-label="close"
                        onClick={handleClosePreview}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {previewUrl && (
                        <iframe
                            src={previewUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 'none', minHeight: '600px' }}
                            title="File Preview Fullscreen"
                            onError={() => {
                                console.error("Error loading preview");
                                alert("Không thể tải preview. Vui lòng thử lại.");
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EditExam;