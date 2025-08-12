import { Box, FormControlLabel, MenuItem, Radio, RadioGroup, Select, TextField } from "@mui/material"
import { memo, useState, useEffect, useRef } from "react";

const AnsweringCard = memo(({ questionIndex, onQuestionChange, initialData }) => {
    const [questionType, setQuestionType] = useState('single-choice');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const isInitialized = useRef(false);

    // Initialize state with data from API when editing
    useEffect(() => {
        if (initialData && !isInitialized.current) {
            setQuestionType(initialData.type || 'single-choice');
            setCorrectAnswer(initialData.correct_answer || '');
            isInitialized.current = true;
        }
    }, [initialData, questionIndex]);

    // Notify parent về thay đổi
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
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            mb: 1,
            backgroundColor: 'white',
            minHeight: '60px',
            width: "100%"
        }}>
            {/* Question number */}
            <Box sx={{
                fontWeight: 600,
                fontSize: '1.6rem',
                color: '#333',
                minWidth: '50px',
                flexShrink: 0
            }}>
                Câu {questionIndex + 1}
            </Box>

            {/* Question type */}
            <Select
                value={questionType}
                onChange={handleTypeChange}
                size="small"
                sx={{
                    minWidth: 110,
                    flexShrink: 0,
                    '& .MuiSelect-select': {
                        fontSize: '1.4rem'
                    }
                }}
            >
                <MenuItem sx={{ fontSize: "1.4rem" }} value="single-choice">1 đáp án</MenuItem>
                <MenuItem sx={{ fontSize: "1.4rem" }} value="multiple-choice">Nhiều đáp án</MenuItem>
                <MenuItem sx={{ fontSize: "1.4rem" }} value="long-response">Tự luận</MenuItem>
            </Select>

            {/* Answer section */}
            {questionType === 'long-response' ? (
                <TextField
                    placeholder="Đáp án mẫu..."
                    value={correctAnswer}
                    onChange={(e) => {
                        const value = e.target.value;
                        setCorrectAnswer(value);
                        notifyChange({
                            type: questionType,
                            correct_answer: value
                        });
                    }}
                    size="small"
                    sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            fontSize: '1.2rem'
                        }
                    }}
                />
            ) : questionType === 'single-choice' ? (
                <RadioGroup
                    row
                    value={correctAnswer}
                    onChange={handleCorrectAnswerChange}
                    sx={{ gap: 2, flex: 1 }}
                >
                    {['A', 'B', 'C', 'D'].map((option) => (
                        <FormControlLabel
                            key={option}
                            value={option}
                            control={
                                <Radio
                                    sx={{
                                        '& .MuiSvgIcon-root': {
                                            fontSize: '1.9rem'
                                        }
                                    }}
                                />
                            }
                            label={option}
                            sx={{
                                margin: 0,
                                '& .MuiFormControlLabel-label': {
                                    fontSize: '1.4rem',
                                    fontWeight: 500
                                }
                            }}
                        />
                    ))}
                </RadioGroup>
            ) : (
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
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
                                        marginRight: 4,
                                        accentColor: '#1976d2',
                                        transform: 'scale(1.2)'
                                    }}
                                />
                            }
                            label={option}
                            sx={{
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                '& .MuiFormControlLabel-label': {
                                    fontSize: '1.4rem',
                                    fontWeight: 500
                                }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
});

export default AnsweringCard;