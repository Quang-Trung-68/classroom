// CreateExam.tsx
import React, { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Breadcrumbs,
  Link,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import PreviewIcon from "@mui/icons-material/Preview";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import ArticleIcon from "@mui/icons-material/Article";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";

import AnsweringCard from "../../../components/cards/AnsweringCard/AnsweringCard";
import { useExamState } from "../../../stores/examStore";
import { useNavigate, useParams } from "react-router-dom";
import { generateRoutes } from "../../../router/routes";

const RenderQuestions = memo(({ count, onQuestionsChange, questionsData }: any) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <AnsweringCard
          key={index}
          questionIndex={index}
          onQuestionChange={onQuestionsChange}
          initialData={questionsData?.[index] ?? null}
        />
      ))}
    </>
  );
});

const getFileIcon = (fileType?: string) => {
  switch (fileType) {
    case "application/pdf":
      return <PictureAsPdfIcon sx={{ color: "#d32f2f" }} />;
    case "image/jpeg":
    case "image/jpg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      return <ImageIcon sx={{ color: "#ff9800" }} />;
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return <ArticleIcon sx={{ color: "#1976d2" }} />;
    case "text/plain":
      return <TextSnippetIcon sx={{ color: "#388e3c" }} />;
    default:
      return <ArticleIcon sx={{ color: "#757575" }} />;
  }
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const CreateExam: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // file preview states
  const [textPreview, setTextPreview] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string>("");

  // dialog fullscreen preview
  const [previewOpen, setPreviewOpen] = useState(false);

  const { examSelecting, createExam } = useExamState();
  const navigate = useNavigate();
  const { id, exam_group_id } = useParams();

  // form state
  const defaultExamData = useMemo(
    () => ({
      exam_group: String(examSelecting?.id || ""),
      description: "default",
      name: "",
      code: "",
      total_time: 0,
      number_of_question: 1,
      questions: [],
      file: {
        id: null,
        payload: "",
        url: "",
      },
    }),
    [examSelecting?.id]
  );

  const [examData, setExamData] = useState<any>(defaultExamData);
  const [isLoading, setIsLoading] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = (err) => reject(err);
    });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getFileTypeFromName = useCallback((fileName?: string) => {
    if (!fileName) return "unknown";
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "application/pdf";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      case "doc":
        return "application/msword";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "txt":
        return "text/plain";
      default:
        return "unknown";
    }
  }, []);

  // Function to create a temporary URL for the file
  const createFileBlobURL = (file: File) => {
    return URL.createObjectURL(file);
  };

  // Function to check if file is an image
  const isImageFile = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  // Function to check if file is PDF
  const isPDFFile = (fileType: string) => {
    return fileType === "application/pdf";
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setFileProcessing(true);
      setTextPreview("");
      
      // Revoke previous blob URL to prevent memory leaks
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl("");
      }

      // validation
      if (file.size > 10 * 1024 * 1024) {
        alert("File quá lớn! Vui lòng chọn file nhỏ hơn 10MB.");
        setSelectedFile(null);
        setFileProcessing(false);
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/gif",
        "image/webp",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      // Some browsers may give empty type for certain files; fallback to extension
      const fileType = file.type && file.type !== "" ? file.type : getFileTypeFromName(file.name);
      if (!allowedTypes.includes(fileType)) {
        alert("Định dạng file không được hỗ trợ! Chỉ hỗ trợ PDF, ảnh (JPG, PNG, GIF, WebP), Word và file text.");
        setSelectedFile(null);
        setFileProcessing(false);
        return;
      }

      // create base64 payload for server side if needed
      const base64String = await fileToBase64(file);

      // Create blob URL for preview
      const newBlobUrl = createFileBlobURL(file);
      setBlobUrl(newBlobUrl);

      setExamData((prev: any) => ({
        ...prev,
        file: {
          id: null,
          payload: base64String,
          url: newBlobUrl,
        },
      }));

      // Handle text files separately
      if (fileType === "text/plain") {
        const text = await file.text();
        setTextPreview(text);
      }

    } catch (error) {
      console.error("Error processing file:", error);
      alert("Có lỗi xảy ra khi xử lý file!");
      setSelectedFile(null);
      setExamData((prev: any) => ({ ...prev, file: { id: null, payload: "", url: "" } }));
    } finally {
      setFileProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    // Clean up object URL to prevent memory leaks
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl("");
    }
    
    setSelectedFile(null);
    setTextPreview("");
    setExamData((prev: any) => ({ ...prev, file: { id: null, payload: "", url: "" } }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Clean up object URLs when component unmounts or blobUrl changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleInputChange = (field: string) => (event: any) => {
    let value = event.target.value;
    if (field === "number_of_question") value = Math.max(1, parseInt(value) || 1);
    else if (field === "total_time") value = Math.max(0, parseInt(value) || 0);

    setExamData((prev: any) => {
      const newData = { ...prev, [field]: value };
      if (field === "number_of_question") {
        const current = prev.questions || [];
        newData.questions = Array(value)
          .fill(null)
          .map((_, idx) => current[idx] || { index: idx, type: "single-choice", question: "", correct_answer: "" });
      }
      return newData;
    });
  };

  const handleQuestionsChange = (questionIndex: number, questionData: any) => {
    setExamData((prev: any) => {
      const newQuestions = [...(prev.questions || [])];
      newQuestions[questionIndex] = { index: questionIndex, ...questionData };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleCreateExam = async () => {
    if (!examData.name?.trim() || !examData.code?.trim()) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
    setIsLoading(true);
    try {
      await createExam(examData);
      navigate(generateRoutes.examDetail(id, exam_group_id));
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("Có lỗi xảy ra khi tạo đề bài!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPreviewDialog = () => setPreviewOpen(true);
  const handleClosePreviewDialog = () => setPreviewOpen(false);

  const handleDownloadFile = () => {
    if (examData.file?.payload) {
      const link = document.createElement("a");
      link.href = examData.file.payload;
      link.download = selectedFile?.name || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (blobUrl) {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = selectedFile?.name || "file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Không có file để tải xuống");
    }
  };

  // Render preview content based on file type
  const renderPreviewContent = () => {
    if (fileProcessing) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography>Đang xử lý nội dung file...</Typography>
        </Box>
      );
    }

    if (textPreview) {
      return (
        <Box
          component="pre"
          sx={{
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            backgroundColor: "#f8f9fa",
            p: 2,
            borderRadius: 1,
            border: "1px solid #e9ecef",
            margin: 0,
            maxHeight: 420,
            overflow: "auto",
          }}
        >
          {textPreview}
        </Box>
      );
    }

    if (blobUrl && selectedFile) {
      const fileType = selectedFile.type || getFileTypeFromName(selectedFile.name);
      
      if (isImageFile(fileType)) {
        return (
          <Box sx={{ textAlign: "center" }}>
            <img
              src={blobUrl}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "420px",
                border: "1px solid #e9ecef",
                borderRadius: "4px",
                objectFit: "contain"
              }}
              onError={() => {
                console.error("Failed to load image preview");
              }}
            />
          </Box>
        );
      }

      if (isPDFFile(fileType)) {
        return (
          <Box sx={{ width: "100%", height: 400 }}>
            <iframe
              src={blobUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              title="PDF Preview"
              style={{
                border: "1px solid #e9ecef",
                borderRadius: "4px",
              }}
              onError={() => {
                console.error("Failed to load PDF preview");
              }}
            />
          </Box>
        );
      }
    }

    return (
      <Box sx={{ p: 3, textAlign: "center", backgroundColor: "#f8f9fa", borderRadius: 1, border: "1px solid #e9ecef" }}>
        <Typography variant="body2" color="text.secondary">
          Không có nội dung preview cho loại file này.
        </Typography>
      </Box>
    );
  };

  // Render fullscreen preview content
  const renderFullscreenPreviewContent = () => {
    if (textPreview) {
      return (
        <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
          <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {textPreview}
          </Box>
        </Box>
      );
    }

    if (blobUrl && selectedFile) {
      const fileType = selectedFile.type || getFileTypeFromName(selectedFile.name);
      
      if (isImageFile(fileType)) {
        return (
          <Box sx={{ p: 2, textAlign: "center", height: "100%", overflow: "auto" }}>
            <img
              src={blobUrl}
              alt="Full Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain"
              }}
            />
          </Box>
        );
      }

      if (isPDFFile(fileType)) {
        return (
          <iframe
            src={blobUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Full Screen PDF Preview"
            style={{ border: "none" }}
          />
        );
      }
    }

    return (
      <Box sx={{ p: 4 }}>
        <Typography>Không có preview để hiển thị.</Typography>
      </Box>
    );
  };

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
          Thêm bài thi
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4} sx={{ alignItems: "start", justifyContent: "space-between" }}>
        <Grid size={6}>
          {/* File Upload Area */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: selectedFile ? "auto" : 120,
              }}
            >
              {!selectedFile ? (
                <Button
                  onClick={handleUploadClick}
                  startIcon={<FileUploadIcon />}
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    py: 2,
                    px: 4,
                    borderStyle: "dashed",
                    borderWidth: 2,
                    fontSize: "1rem",
                  }}
                  disabled={fileProcessing}
                >
                  Tải lên file từ máy (PDF, Ảnh, Word, Text)
                </Button>
              ) : (
                <Card sx={{ width: "100%" }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                      {getFileIcon(selectedFile.type || getFileTypeFromName(selectedFile.name))}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: "bold",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selectedFile.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedFile.size ? formatFileSize(selectedFile.size) : ""}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      <Button size="small" onClick={handleUploadClick} sx={{ textTransform: "none" }}>
                        Chọn file khác
                      </Button>

                      {/* Preview full-screen button */}
                      {(textPreview || blobUrl) && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={handleOpenPreviewDialog}
                          startIcon={<VisibilityIcon />}
                          sx={{ textTransform: "none" }}
                        >
                          Xem toàn màn hình
                        </Button>
                      )}

                      {(examData.file.payload || blobUrl) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleDownloadFile}
                          sx={{ textTransform: "none" }}
                        >
                          Tải xuống
                        </Button>
                      )}

                      <IconButton size="small" color="error" onClick={handleRemoveFile} title="Xóa file">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Preview area */}
            {selectedFile && (
              <Card sx={{ width: "100%", flexGrow: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <PreviewIcon />
                    Xem trước nội dung
                    {fileProcessing && (
                      <Typography variant="body2" color="primary" sx={{ ml: 1 }}>
                        (Đang xử lý...)
                      </Typography>
                    )}
                  </Typography>

                  <Box sx={{ minHeight: 200, maxHeight: 600, overflow: "auto" }}>
                    {renderPreviewContent()}
                  </Box>
                </CardContent>
              </Card>
            )}

            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt" 
            />
          </Box>
        </Grid>

        <Grid size={6} container>
          <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
            <Box>Tên đề *</Box>
            <Box>
              <TextField fullWidth size="small" required label="Nhập tên đề" value={examData.name} onChange={handleInputChange("name")} />
            </Box>
          </Grid>

          <Grid size={6} container sx={{ gap: "10px", flexDirection: "column" }}>
            <Box>Mã đề *</Box>
            <Box>
              <TextField fullWidth size="small" required label="Nhập mã đề" value={examData.code} onChange={handleInputChange("code")} />
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
                onChange={handleInputChange("total_time")}
                inputProps={{
                  min: 1,
                  max: 300,
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
                onChange={handleInputChange("number_of_question")}
              />
            </Box>
          </Grid>

          <Grid container size={12}>
            <RenderQuestions count={examData.number_of_question} onQuestionsChange={handleQuestionsChange} questionsData={examData.questions || []} />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button variant="contained" onClick={handleCreateExam} disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo đề bài"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>

      {/* Fullscreen preview dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreviewDialog} maxWidth="lg" fullWidth sx={{ "& .MuiDialog-paper": { height: "90vh" } }}>
        <DialogTitle>
          Xem trước file: {selectedFile?.name}
          <IconButton aria-label="close" onClick={handleClosePreviewDialog} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ width: "100%", height: "100%" }}>
            {renderFullscreenPreviewContent()}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateExam;