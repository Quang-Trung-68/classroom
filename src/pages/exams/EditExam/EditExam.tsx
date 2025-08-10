import React, { memo, useEffect, useRef, useState } from "react";
import { Box, Button, Grid, TextField, Breadcrumbs, Link, Typography, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import AnsweringCard from "../../../components/cards/AnsweringCard/AnsweringCard";
import { useExamState } from "../../../stores/examStore";
import { useNavigate, useParams } from "react-router-dom";

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

const EditExam = () => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const { examSelecting, getExamDetail, examDetail, putExamDetail } = useExamState();
    const navigate = useNavigate()
    const { id, exam_group_id, exam_id } = useParams();

    // State cho form data
    const [examData, setExamData] = useState({
        exam_group: Number(examSelecting.id),
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
    });

    useEffect(() => {
        if (exam_id) {
            getExamDetail(Number(exam_id));
        }
    }, [exam_id]);

    // Update examData when examDetail changes
    useEffect(() => {
        if (examDetail && examDetail.id) {
            console.log("Updating examData with:", examDetail);

            // Tạo questions array với đầy đủ thông tin
            const formattedQuestions = examDetail.questions?.map((q, index) => ({
                id: q.id || null,
                index: q.index !== undefined ? q.index : index,
                type: q.type || 'single-choice',
                question: q.question || '',
                correct_answer: q.correct_answer || ''
            })) || [];

            setExamData({
                id: examDetail.id,
                exam_group: examDetail.exam_group || Number(examSelecting.id),
                description: examDetail.description || "default",
                name: examDetail.name || "",
                code: examDetail.code || "",
                total_time: examDetail.total_time || 0,
                number_of_question: examDetail.number_of_question || 1,
                questions: formattedQuestions,
                file: {
                    id: examDetail.file?.id || null,
                    url: examDetail.file?.url || "", // Giữ nguyên URL từ server
                    payload: "" // Payload trống khi load từ server
                }
            });

            // Nếu có file từ server, tạo selectedFile để hiển thị
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
        }
    }, [examDetail?.id, examSelecting.id, examDetail]);

    // Helper function để lấy file type từ tên file
    const getFileTypeFromName = (fileName) => {
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
    };

    console.log("Current examData:", examData);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            console.log("Selected file:", file.name);
            handleFileUpload(file);
        }
    };

    // Hàm chuyển file thành base64
    const fileToBase64 = (file): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (file) => {
        try {
            // Kiểm tra kích thước file (ví dụ: tối đa 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.");
                setSelectedFile(null);
                return;
            }

            // Kiểm tra định dạng file
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

            console.log("Processing file:", file.name);

            // Chuyển file thành base64
            const base64String: string = await fileToBase64(file);

            // Cập nhật examData với file mới
            setExamData(prev => ({
                ...prev,
                file: {
                    id: null, // Reset id khi upload file mới
                    url: prev.file.url, // Giữ nguyên URL cũ
                    payload: base64String // Set payload là base64 của file mới
                }
            }));

            console.log("File processed successfully:", {
                name: file.name,
                type: file.type,
                size: file.size,
                base64Length: base64String.length
            });

        } catch (error) {
            console.error("Error processing file:", error);
            alert("Có lỗi xảy ra khi xử lý file!");
            setSelectedFile(null);

            // Reset về trạng thái ban đầu nếu có lỗi
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

        // Chuyển đổi sang number cho các field cần thiết
        if (field === 'number_of_question') {
            value = parseInt(value) || 1;
        } else if (field === 'total_time') {
            value = parseInt(value) || 0;
        }

        setExamData(prev => {
            const newData = {
                ...prev,
                [field]: value,
            };

            // Khi thay đổi số câu hỏi, cập nhật array questions
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

    // Hàm xử lý khi câu hỏi thay đổi
    const handleQuestionsChange = (questionIndex, questionData) => {
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
    };

    const handleUpdateExam = async () => {
        console.log("Updating Exam Data:", examData);

        // Chuẩn bị data để gửi lên server (chỉ gửi id, url, payload)
        const dataToSend = {
            ...examData,
            file: {
                id: examData.file.id,
                url: examData.file.url,
                payload: examData.file.payload
            }
        };

        try {
            await putExamDetail(Number(exam_id), dataToSend);
        } catch (error) {
            console.error("Error updating exam:", error);
            alert("Có lỗi xảy ra khi cập nhật đề bài!");
        } finally {
            navigate(`/classes/${id}/exams/${exam_group_id}`);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Reset file data trong examData
        setExamData(prev => ({
            ...prev,
            file: {
                id: null,
                url: "",
                payload: ""
            }
        }));
    };

    // Hàm mở preview file
   const handlePreviewFile = () => {
    let urlToPreview = "";
    let type = selectedFile?.type || "";

    if (examData.file.payload) {
        // File mới upload (base64)
        if (type === "application/pdf" || type === "text/plain") {
            urlToPreview = examData.file.payload; // PDF/TXT: xài trực tiếp
        } else {
            // DOC/DOCX base64 → Blob → object URL
            const byteString = atob(examData.file.payload.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type });
            urlToPreview = `https://docs.google.com/viewer?url=${encodeURIComponent(URL.createObjectURL(blob))}&embedded=true`;
        }
    } else if (examData.file.url) {
        // File từ server
        if (type === "application/pdf" || type === "text/plain") {
            urlToPreview = examData.file.url; // PDF/TXT trực tiếp
        } else {
            // DOC/DOCX từ server → Google Docs Viewer
            urlToPreview = `https://docs.google.com/viewer?url=${encodeURIComponent(examData.file.url)}&embedded=true`;
        }
    }

    if (urlToPreview) {
        setPreviewUrl(urlToPreview);
        setPreviewOpen(true);
    }
};


    const handleClosePreview = () => {
        setPreviewOpen(false);
        setPreviewUrl("");
    };

    // Hàm download file
    const handleDownloadFile = () => {
        if (examData.file.payload) {
            // File mới upload - download từ base64
            const link = document.createElement('a');
            link.href = examData.file.payload;
            link.download = selectedFile?.name || 'file';
            link.click();
        } else if (examData.file.url) {
            // File từ server - mở URL để download
            window.open(examData.file.url, '_blank');
        }
    };

    return (
        <>
            {/* Breadcrumb */}
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
                <Grid size={6}>
                    <Box color={"#000"} sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                        <Button
                            onClick={handleUploadClick}
                            startIcon={<FileUploadIcon />}
                            color="inherit"
                            sx={{ textTransform: "none" }}
                        >
                            Tải lên từ máy
                        </Button>

                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt"
                        />
                    </Box>

                    {selectedFile && (
                        <Box mt={1} textAlign="center">
                            <Box>
                                Đã chọn: <strong>{selectedFile.name}</strong>
                                {selectedFile.isFromServer && (
                                    <Typography variant="caption" color="info.main" display="block">
                                        (File hiện tại từ server)
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ fontSize: '0.875rem', color: '#666', mt: 0.5 }}>
                                Loại: {selectedFile.type}
                                {selectedFile.size > 0 && (
                                    <>| Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</>
                                )}
                            </Box>

                            {examData.file.payload && (
                                <Box sx={{ fontSize: '0.75rem', color: '#888', mt: 0.5 }}>
                                    Base64 length: {examData.file.payload.length} chars
                                </Box>
                            )}

                            <Box mt={1} sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {(examData.file.payload || examData.file.url) && (
                                    <Button
                                        size="small"
                                        color="primary"
                                        onClick={handlePreviewFile}
                                        startIcon={<VisibilityIcon />}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Xem trước
                                    </Button>
                                )}
                                {(examData.file.payload || examData.file.url) && (
                                    <Button
                                        size="small"
                                        color="secondary"
                                        onClick={handleDownloadFile}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Tải xuống
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={handleRemoveFile}
                                    sx={{ textTransform: "none" }}
                                >
                                    Xóa file
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Grid>

                <Grid size={6} container>
                    <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
                        <Box>Tên đề *</Box>
                        <Box>
                            <TextField
                                fullWidth
                                size="small"
                                required
                                label="Nhập tên đề"
                                value={examData.name}
                                onChange={handleInputChange('name')}
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
                                value={examData.code}
                                onChange={handleInputChange('code')}
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
                                value={examData.total_time}
                                onChange={handleInputChange('total_time')}
                                inputProps={{
                                    min: 1,
                                    max: 300
                                }}
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
                                value={examData.number_of_question}
                                onChange={handleInputChange('number_of_question')}
                            />
                        </Box>
                    </Grid>

                    <Grid container size={12}>
                        <RenderQuestions
                            count={examData.number_of_question}
                            onQuestionsChange={handleQuestionsChange}
                            questionsData={examData.questions}
                        />
                    </Grid>

                    <Grid size={12}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Button
                                variant="contained"
                                onClick={handleUpdateExam}
                            >
                                Cập nhật đề bài
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>

            {/* File Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={handleClosePreview}
                maxWidth="lg"
                fullWidth
                sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
            >
                <DialogTitle>
                    Xem trước file
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
    title="File Preview"
/>

                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EditExam;