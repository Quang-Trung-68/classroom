import { Box, FormControlLabel, MenuItem, Radio, RadioGroup, Select, TextField } from "@mui/material"
import { memo, useState, useEffect, useRef } from "react";

const AnsweringCard = memo(({ questionIndex, onQuestionChange, initialData }) => {
    const [questionType, setQuestionType] = useState('single-choice');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const isInitialized = useRef(false);

    // Initialize state with data from API when editing (chỉ chạy một lần)
    useEffect(() => {
        if (initialData && !isInitialized.current) {
            console.log(`Initializing question ${questionIndex} with data:`, initialData);
            
            setQuestionType(initialData.type || 'single-choice');
            setCorrectAnswer(initialData.correct_answer || '');
            
            isInitialized.current = true;
        }
    }, [initialData, questionIndex]);

    // Notify parent về thay đổi (tách riêng để tránh loop)
    const notifyChange = (newData) => {
        onQuestionChange(questionIndex, {
            id: initialData?.id || null,
            ...newData
        });
    };

    const handleTypeChange = (event) => {
        const newType = event.target.value;
        setQuestionType(newType);
        setCorrectAnswer('');

        notifyChange({
            type: newType,
            correct_answer: ''
        });
    };


    const handleCorrectAnswerChange = (event) => {
        let newCorrectAnswer;

        if (questionType === 'multiple-choice') {
            const currentAnswers = correctAnswer.split(',').filter(a => a);
            const selectedValue = event.target.value;

            if (currentAnswers.includes(selectedValue)) {
                newCorrectAnswer = currentAnswers.filter(a => a !== selectedValue).join(',');
            } else {
                newCorrectAnswer = [...currentAnswers, selectedValue].join(',');
            }
        } else {
            newCorrectAnswer = event.target.value;
        }

        setCorrectAnswer(newCorrectAnswer);

        notifyChange({
            type: questionType,
            correct_answer: newCorrectAnswer
        });
    };

    return (
        <Box sx={{
            border: '1px solid #ddd',
            borderRadius: 1,
            p: 1,
            backgroundColor: '#fafafa',
            width: "100%",
            mb: 2
        }}>
            {/* Header row - Question number and type selector */}
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                mb: 2
            }}>
                <Box sx={{
                    fontWeight: 'bold',
                    maxWidth: '80px',
                    flexShrink: 0,
                    color: '#495057',
                    pt: 1
                }}>
                    Câu {questionIndex + 1}:
                </Box>

                <Select
                    value={questionType}
                    onChange={handleTypeChange}
                    sx={{
                        maxWidth: 140,
                        minWidth: 140,                        
                        flexShrink: 0,
                        fontSize: "1.3rem",
                        height: "40px",
                        '& .MuiSelect-select': {
                            padding: '6px 10px',
                            fontSize: "1.2rem",
                            fontWeight: 500
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ccc',
                            borderWidth: '1px'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1976d2',
                            borderWidth: '2px'
                        }
                    }}
                >
                    <MenuItem
                        value="single-choice"
                        sx={{
                            fontSize: "1.2rem",
                            padding: '8px 16px'
                        }}
                    >
                        1 đáp án
                    </MenuItem>
                    <MenuItem
                        value="multiple-choice"
                        sx={{
                            fontSize: "1.2rem",
                            padding: '8px 16px'
                        }}
                    >
                        Nhiều đáp án
                    </MenuItem>
                    <MenuItem
                        value="long-response"
                        sx={{
                            fontSize: "1.2rem",
                            padding: '8px 16px'
                        }}
                    >
                        Tự luận
                    </MenuItem>
                </Select>
            </Box>

            {/* Answer section */}
            <Box sx={{
                width: '100%',
                backgroundColor: '#f8f9fa',
                borderRadius: 1,
                p: 2,
                border: '1px solid #e9ecef'
            }}>
                {questionType === 'long-response' ? (
                    <Box>
                        <Box sx={{
                            fontSize: '1.1rem',
                            color: '#495057',
                            mb: 1,
                            fontWeight: 600
                        }}>
                            Đáp án mẫu:
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Nhập đáp án mẫu (không bắt buộc)..."
                            value={correctAnswer}
                            onChange={(e) => {
                                const value = e.target.value;
                                setCorrectAnswer(value);
                                notifyChange({
                                    type: questionType,
                                    correct_answer: value
                                });
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                    fontSize: '0.95rem',
                                    borderRadius: 1,
                                    '& fieldset': {
                                        borderColor: '#ddd'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#1976d2',
                                        borderWidth: '2px'
                                    },
                                    '& textarea::placeholder': {
                                        fontSize: '0.95rem',
                                        color: '#999'
                                    }
                                }
                            }}
                        />
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{
                            fontSize: '1.1rem',
                            color: '#495057',
                            mb: 2,
                            fontWeight: 600
                        }}>
                            Chọn đáp án đúng:
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            gap: 3,
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }}>
                            {questionType === 'single-choice' ? (
                                <RadioGroup
                                    row
                                    value={correctAnswer}
                                    onChange={handleCorrectAnswerChange}
                                    sx={{
                                        display: 'flex',
                                        gap: 3
                                    }}
                                >
                                    {['A', 'B', 'C', 'D'].map((option) => (
                                        <FormControlLabel
                                            key={option}
                                            value={option}
                                            control={
                                                <Radio
                                                    sx={{
                                                        '&.Mui-checked': {
                                                            color: '#1976d2'
                                                        }
                                                    }}
                                                />
                                            }
                                            label={option}
                                            sx={{
                                                margin: 0,
                                                '& .MuiFormControlLabel-label': {
                                                    fontSize: '1.1rem',
                                                    fontWeight: 500,
                                                    color: '#495057'
                                                }
                                            }}
                                        />
                                    ))}
                                </RadioGroup>
                            ) : (
                                <Box sx={{
                                    display: 'flex',
                                    gap: 3,
                                    flexWrap: 'wrap'
                                }}>
                                    {['A', 'B', 'C', 'D'].map((option) => (
                                        <FormControlLabel
                                            key={option}
                                            control={
                                                <input
                                                    type="checkbox"
                                                    checked={correctAnswer.split(',').includes(option)}
                                                    onChange={handleCorrectAnswerChange}
                                                    value={option}
                                                    style={{
                                                        margin: '0 8px 0 0',
                                                        transform: 'scale(1.2)',
                                                        accentColor: '#1976d2'
                                                    }}
                                                />
                                            }
                                            label={option}
                                            sx={{
                                                margin: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                '& .MuiFormControlLabel-label': {
                                                    fontSize: '1.1rem',
                                                    fontWeight: 500,
                                                    color: '#495057'
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
});

export default AnsweringCard;