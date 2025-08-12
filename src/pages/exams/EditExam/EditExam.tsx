import React, { memo, useEffect, useRef, useState } from "react";
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
                    url: examDetail.file?.url || "",
                    payload: ""
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

    // Update previewUrl when file changes
    useEffect(() => {
        console.log("useEffect triggered - examData.file:", examData.file);
        console.log("selectedFile:", selectedFile);
        updatePreviewUrl();
    }, [examData.file, selectedFile]);

    // Cleanup function cho blob URLs
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

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

    // Helper để lấy file type cho preview
    const getFileTypeForPreview = () => {
        if (selectedFile?.isFromServer && examData.file.url) {
            return getFileTypeFromName(examData.file.url);
        }
        return selectedFile?.type || "";
    };

    // Check xem có thể preview file không
    const canPreviewFile = () => {
        const type = getFileTypeForPreview();

        if (examData.file.url && !examData.file.payload) {
            // File từ server - có thể preview tất cả
            return true;
        } else if (examData.file.payload) {
            // File mới upload - có thể preview PDF và TXT
            return type === "application/pdf" || type === "text/plain";
        }

        return false;
    };

    // Function để cập nhật preview URL
    const updatePreviewUrl = () => {
        console.log("updatePreviewUrl called");
        console.log("selectedFile:", selectedFile);
        console.log("examData.file:", examData.file);

        if (!selectedFile) {
            console.log("No selected file, clearing preview");
            setPreviewUrl("");
            return;
        }

        let urlToPreview = "";
        const type = getFileTypeForPreview();
        console.log("File type for preview:", type);

        if (examData.file.payload) {
            console.log("Processing file with payload, length:", examData.file.payload.length);
            // File mới upload (base64)
            if (type === "application/pdf") {
                // Đối với PDF, sử dụng trực tiếp base64 data URL
                console.log("Setting PDF preview from base64");
                urlToPreview = examData.file.payload;
            } else if (type === "text/plain") {
                // Đối với text file, tạo blob URL
                try {
                    console.log("Creating text preview from base64");
                    const base64Data = examData.file.payload.split(',')[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'text/plain' });
                    urlToPreview = URL.createObjectURL(blob);
                    console.log("Text blob URL created:", urlToPreview);
                } catch (error) {
                    console.error("Error creating text preview:", error);
                    urlToPreview = "";
                }
            } else if (type.includes("word") || type.includes("document")) {
                // Đối với Word files, không thể preview trực tiếp từ base64
                console.log("Word file detected, no preview available");
                urlToPreview = "";
            }
        } else if (examData.file.url) {
            console.log("Processing file with URL:", examData.file.url);
            // File từ server
            if (type === "application/pdf" || type === "text/plain") {
                urlToPreview = examData.file.url;
            } else {
                urlToPreview = `https://docs.google.com/viewer?url=${encodeURIComponent(examData.file.url)}&embedded=true`;
            }
        }

        console.log("Final preview URL:", urlToPreview);
        setPreviewUrl(urlToPreview);
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
                    id: null,
                    url: "",
                    payload: base64String
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

        // Chuẩn bị data để gửi lên server
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
            navigate(generateRoutes.examDetail(id, exam_group_id))
        }
    };

    const handleRemoveFile = () => {
        // Cleanup blob URL nếu có
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setPreviewUrl("");

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

    // Hàm mở preview file trong dialog
    const handleOpenPreviewDialog = () => {
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
    };

    // Hàm download file
    const handleDownloadFile = () => {
        if (examData.file.payload) {
            // File mới upload - download từ base64
            const link = document.createElement('a');
            link.href = examData.file.payload;
            link.download = selectedFile?.name || 'file';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (examData.file.url) {
            // File từ server - mở URL để download
            window.open(examData.file.url, '_blank');
        }
    };

    // Helper để hiển thị thông tin preview availability
    const getPreviewInfo = () => {
        const type = getFileTypeForPreview();

        if (examData.file.url && !examData.file.payload) {
            return { canPreview: true, message: "Có thể xem trước" };
        } else if (examData.file.payload) {
            if (type === "application/pdf" || type === "text/plain") {
                return { canPreview: true, message: "Có thể xem trước" };
            } else {
                return { canPreview: false, message: "Chỉ có thể xem sau khi lưu" };
            }
        }

        return { canPreview: false, message: "" };
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
                {/* Phần Preview bên trái */}
                <Grid size={6}>
                    <Box sx={{
                        height: '70vh',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header với nút upload và thông tin file */}
                        <Box sx={{
                            p: 2,
                            borderBottom: '1px solid #ddd',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            <Button
                                onClick={handleUploadClick}
                                startIcon={<FileUploadIcon />}
                                variant="outlined"
                                sx={{ textTransform: "none", alignSelf: 'center' }}
                            >
                                Tải lên file đề bài
                            </Button>

                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt"
                            />

                            {selectedFile && (
                                <Box>
                                    <Box sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        {selectedFile.name}
                                        {selectedFile.isFromServer && (
                                            <Typography variant="caption" color="info.main" display="block">
                                                (File hiện tại từ server)
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ fontSize: '0.8rem', color: '#666', mt: 0.5 }}>
                                        Loại: {selectedFile.type}
                                        {selectedFile.size > 0 && (
                                            <>| Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</>
                                        )}
                                    </Box>

                                    {/* Action buttons */}
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                        {canPreviewFile() && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                onClick={handleOpenPreviewDialog}
                                                startIcon={<VisibilityIcon />}
                                                sx={{ textTransform: "none" }}
                                            >
                                                Toàn màn hình
                                            </Button>
                                        )}
                                        {(examData.file.payload || examData.file.url) && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="secondary"
                                                onClick={handleDownloadFile}
                                                sx={{ textTransform: "none" }}
                                            >
                                                Tải xuống
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={handleRemoveFile}
                                            sx={{ textTransform: "none" }}
                                        >
                                            Xóa file
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Phần preview */}
                        <Box sx={{
                            flex: 1,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {(() => {
                                console.log("Rendering preview area, previewUrl:", previewUrl);
                                console.log("selectedFile:", selectedFile);
                                console.log("canPreviewFile():", canPreviewFile());

                                if (previewUrl) {
                                    console.log("Rendering iframe with URL:", previewUrl.substring(0, 100) + "...");

                                    // Kiểm tra xem có phải PDF không để có thể dùng object tag backup
                                    const isPDF = previewUrl.startsWith('data:application/pdf');

                                    return (
                                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                            {isPDF ? (
                                                // Sử dụng object tag cho PDF vì một số browser hỗ trợ tốt hơn
                                                <object
                                                    data={previewUrl}
                                                    type="application/pdf"
                                                    width="100%"
                                                    height="100%"
                                                    style={{ borderRadius: '4px' }}
                                                >
                                                    {/* Fallback iframe nếu object không hoạt động */}
                                                    <iframe
                                                        src={previewUrl}
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 'none', borderRadius: '4px' }}
                                                        title="File Preview"
                                                        onLoad={() => console.log("Iframe loaded successfully")}
                                                        onError={(e) => {
                                                            console.error("Error loading preview iframe:", e);
                                                        }}
                                                    />
                                                </object>
                                            ) : (
                                                // Dùng iframe cho các file khác
                                                <iframe
                                                    src={previewUrl}
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 'none', borderRadius: '4px' }}
                                                    title="File Preview"
                                                    onLoad={() => console.log("Iframe loaded successfully")}
                                                    onError={(e) => {
                                                        console.error("Error loading preview iframe:", e);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                } else if (selectedFile) {
                                    console.log("No preview URL but has selectedFile");
                                    return (
                                        <Box sx={{
                                            textAlign: 'center',
                                            color: '#666',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <FileUploadIcon sx={{ fontSize: 60, opacity: 0.5 }} />
                                            <Typography>
                                                {!canPreviewFile()
                                                    ? "File này không thể xem trước trực tiếp"
                                                    : "Đang tải preview..."
                                                }
                                            </Typography>
                                            {!canPreviewFile() && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Bạn có thể tải xuống để xem nội dung file
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                } else {
                                    console.log("No file selected");
                                    return (
                                        <Box sx={{
                                            textAlign: 'center',
                                            color: '#999',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <FileUploadIcon sx={{ fontSize: 80, opacity: 0.3 }} />
                                            <Typography variant="h6">
                                                Chưa có file đề bài
                                            </Typography>
                                            <Typography variant="body2">
                                                Vui lòng tải lên file để xem trước
                                            </Typography>
                                        </Box>
                                    );
                                }
                            })()}
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

            {/* File Preview Dialog cho xem toàn màn hình */}
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