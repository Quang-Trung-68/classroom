import React, { memo, useEffect, useRef, useState } from "react";
import { Box, Button, Grid, TextField } from "@mui/material";
import FileUploadIcon from '@mui/icons-material/FileUpload';
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
    const { examSelecting, createExam, getExamDetail, examDetail } = useExamState();
    const navigate = useNavigate()
    const { id, exam_group_id, exam_id } = useParams();

    // State cho form data
    const [examData, setExamData] = useState({
        exam_group: String(examSelecting.id),
        description: "default",
        name: "",
        code: "",
        total_time: 0,
        number_of_question: 1,
        questions: [],
        file: {
            id: null,
            payload: "",
            type: "",
            url: ""
        }
    });

    useEffect(() => {
        if (exam_id) {
            getExamDetail(Number(exam_id));
        }
    }, [exam_id]);

    // Update examData when examDetail changes (chỉ chạy một lần)
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
                exam_group: examDetail.exam_group?.toString() || String(examSelecting.id),
                description: examDetail.description || "default",
                name: examDetail.name || "",
                code: examDetail.code || "",
                total_time: examDetail.total_time || 0,
                number_of_question: examDetail.number_of_question || 1,
                questions: formattedQuestions,
                file: {
                    id: examDetail.file?.id || null,
                    payload: examDetail.file?.payload || "",
                    type: examDetail.file?.type || "",
                    url: examDetail.file?.url || ""
                }
            });

            // Nếu có file, set selectedFile để hiển thị thông tin
            if (examDetail.file?.url) {
                // Tạo một file object giả để hiển thị thông tin
                const mockFile = {
                    name: examDetail.file.key?.split('/').pop() || 'Uploaded file',
                    size: 0, // Không có thông tin size từ API
                    type: examDetail.file.type || 'unknown'
                };
                setSelectedFile(mockFile);
            }
        }
    }, [examDetail?.id]); // Chỉ depend vào examDetail.id

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

            // Tạo blob URL
            const blobUrl = URL.createObjectURL(file);

            // Cập nhật examData với thông tin file
            setExamData(prev => ({
                ...prev,
                file: {
                    id: null, // Reset id khi upload file mới
                    payload: base64String,
                    type: file.type,
                    url: blobUrl
                }
            }));

            console.log("File processed successfully:", {
                name: file.name,
                type: file.type,
                size: file.size,
                base64Length: base64String.length
            });

            // Xử lý nội dung file nếu cần
            if (file.type === 'text/plain') {
                const text = await file.text();
                console.log("File content:", text);
                // TODO: Parse nội dung để tạo câu hỏi tự động
            }

        } catch (error) {
            console.error("Error processing file:", error);
            alert("Có lỗi xảy ra khi xử lý file!");
            setSelectedFile(null);

            // Reset file data trong examData
            setExamData(prev => ({
                ...prev,
                file: {
                    id: null,
                    payload: "",
                    type: "",
                    url: ""
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
                    // Giữ lại dữ liệu cũ nếu có, tạo mới nếu không
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
                ...newQuestions[questionIndex], // Giữ lại id nếu có
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
        try {
            // Log thông tin file để debug
            if (examData.file.payload) {
                console.log("File info:", {
                    type: examData.file.type,
                    payloadLength: examData.file.payload.length,
                    url: examData.file.url
                });
            }

            // TODO: Gọi API update exam thay vì create
            // await updateExam(examData)
        } catch (error) {
            console.error("Error updating exam:", error);
            alert("Có lỗi xảy ra khi cập nhật đề bài!");
        } finally {
            navigate(`/classes/${id}/exams/${exam_group_id}`);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);

        // Cleanup blob URL để tránh memory leak
        if (examData.file.url && !examData.file.url.includes('amazonaws.com')) {
            URL.revokeObjectURL(examData.file.url);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Reset file data trong examData
        setExamData(prev => ({
            ...prev,
            file: {
                id: null,
                payload: "",
                type: "",
                url: ""
            }
        }));
    };

    // Cleanup blob URL khi component unmount
    React.useEffect(() => {
        return () => {
            if (examData.file.url && !examData.file.url.includes('amazonaws.com')) {
                URL.revokeObjectURL(examData.file.url);
            }
        };
    }, [examData.file.url]);

    return (
        <>
            <Grid container spacing={4} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Grid size={12}>
                    Danh sách bài thi {">"} Đề thi lần 1 {">"} Sửa bài thi
                </Grid>

                <Grid size={6}>
                    <Box color={"#000"} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                            </Box>
                            <Box sx={{ fontSize: '0.875rem', color: '#666', mt: 0.5 }}>
                                Loại: {examData.file.type}
                                {selectedFile.size > 0 && (
                                    <>| Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</>
                                )}
                            </Box>
                            {examData.file.payload && (
                                <Box sx={{ fontSize: '0.75rem', color: '#888', mt: 0.5 }}>
                                    Base64 length: {examData.file.payload.length} chars
                                </Box>
                            )}
                            <Box mt={1}>
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
        </>
    );
};

export default EditExam;