'use client';

import React, { useEffect, useState } from "react";

import { useRouter, useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import {
    Box, Button, Typography, Paper, TextField,
    Select, MenuItem, Checkbox, Alert, Skeleton
} from "@mui/material";

import { toast } from "react-toastify";

const difficultyIcons = {
    Easy: "🌶️",
    Medium: "🌶️🌶️",
    Hard: "🌶️🌶️🌶️",
};

const difficultyMap = {
    1: "Easy",
    2: "Medium",
    3: "Hard"
};

const QueastionQuizPage = () => {

    const router = useRouter();

    const { mId, aId, lang } = useParams();
    const { data: session } = useSession();
    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [sections, setSections] = useState([]);
    const [selected, setSelected] = useState({ sectionId: null, questionId: null });
    const [error, setError] = useState("");
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [tempSectionTitle, setTempSectionTitle] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchQuestion = async (keepSelected = null) => {
        setLoading(true);

        try {

            const res = await fetch(`${API_URL}/company/quiz/question/${mId}/${aId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            });

            const json = await res.json();

            if (res.ok && Array.isArray(json?.data)) {
                const dynamicSections = [
                    {
                        id: Date.now(),
                        title: "Section A",
                        questions: json.data.map((q) => {


                            const rawOptions = [
                                q.option1 ?? "",
                                q.option2 ?? "",
                                q.option3 ?? "",
                                q.option4 ?? "",
                                q.option5 ?? "",
                                q.option6 ?? ""
                            ];

                            const options = rawOptions.filter(opt => {
                                if (!opt) return false;
                                const val = opt.toString().trim();
                                
                                if (!val) return false;
                                if (val.toUpperCase() === "NULL") return false;
                                
                                return true;
                            });

                            let correctIndex = null;
                            let correctIndices = [];

                            if (q.correct_answer?.includes(",")) {
                                correctIndices = q.correct_answer
                                    .split(",")
                                    .map(num => Number(num) - 1)
                                    .filter(num => num >= 0 && num < options.length);
                            } else {
                                correctIndex = Number(q.correct_answer) - 1;
                            }

                            return {
                                _id: q._id,
                                id: q._id,
                                type: correctIndices.length > 0 ? "Multiple Correct" : "Single Correct",
                                difficulty: difficultyMap[q.diffculty] || "Easy",
                                marks: q.marks || 1,
                                text: q.question,
                                options,
                                correctIndex,
                                correctIndices,
                                explanation: q.answer_explanation || "",
                                useAnswerExplanation: !!q.answer_explanation
                            };
                        })
                    }
                ];

                setSections(dynamicSections);

                // If keepSelected is provided, try to preserve selection
                if (keepSelected) {
                    // Check if section still exists
                    const secExists = dynamicSections.find(s => s.id === keepSelected.sectionId);

                    if (secExists) {
                        // Check if question still exists
                        const questionExists = secExists.questions.find(q => q.id === keepSelected.questionId);

                        if (questionExists) {
                            setSelected({ sectionId: keepSelected.sectionId, questionId: keepSelected.questionId });

                            return;
                        }
                    }
                }

                // Default selection fallback: first question of first section
                if (dynamicSections[0]?.questions?.length) {
                    setSelected({
                        sectionId: dynamicSections[0].id,
                        questionId: dynamicSections[0].questions[0].id
                    });
                } else {
                    setSelected({ sectionId: null, questionId: null });
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) fetchQuestion();
    }, [API_URL, token]);

    const getSelectedQuestion = () => {
        const sec = sections.find(s => s.id === selected.sectionId);

        return sec?.questions.find(q => q.id === selected.questionId) || null;
    };

    const updateQuestion = (sectionId, questionId, updater) => {
        setSections(prev =>
            prev.map(sec => sec.id === sectionId
                ? { ...sec, questions: sec.questions.map(q => q.id === questionId ? updater(q) : q) }
                : sec
            )
        );
    };

    const handleUpdateQuestionField = (sectionId, questionId, key, value) => {
        updateQuestion(sectionId, questionId, q => {
            if (key === "type") {
                if (value === "Multiple Correct") {
                    const newCorrectIndices = q.correctIndices?.length
                        ? q.correctIndices
                        : q.correctIndex != null
                            ? [q.correctIndex]
                            : [];

                    return { ...q, type: value, correctIndices: newCorrectIndices, correctIndex: null };
                } else {
                    const newCorrectIndex =
                        q.correctIndices?.length ? q.correctIndices[0] : q.correctIndex ?? null;

                    return { ...q, type: value, correctIndex: newCorrectIndex, correctIndices: [] };
                }
            }

            return { ...q, [key]: value };
        });
    };

    const handleSelectOption = (index) => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            if (q.type === "Single Correct") {
                return { ...q, correctIndex: index, correctIndices: [] };
            } else {
                const set = new Set(q.correctIndices || []);

                set.has(index) ? set.delete(index) : set.add(index);

                return { ...q, correctIndices: Array.from(set), correctIndex: null };
            }
        });
    };

    const handleUpdateOption = (idx, val) => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            const opts = q.options.map((o, i) => i === idx ? val : o);

            return { ...q, options: opts };
        });
    };

    const handleAddOption = () => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            if (q.options.length >= 6) {
                return q; // Don't modify if already at limit
            }
            
            return { ...q, options: [...q.options, ""] };
        });
    };

    useEffect(() => {
        if (sections.length && selected.sectionId === null) {
            setSelected({
                sectionId: sections[0].id,
                questionId: sections[0].questions[0]?.id ?? null
            });
        }
    }, [sections]);

    const handleRemoveOption = (idx) => {
        updateQuestion(selected.sectionId, selected.questionId, q => {
            const newOpts = q.options.filter((_, i) => i !== idx);
            let newCorrectIndex = q.correctIndex;
            let newCorrectIndices = [...(q.correctIndices || [])];

            if (q.type === "Single Correct") {
                if (newCorrectIndex === idx) newCorrectIndex = null;
                else if (newCorrectIndex > idx) newCorrectIndex -= 1;
            } else {
                newCorrectIndices = newCorrectIndices
                    .filter(i => i !== idx)
                    .map(i => i > idx ? i - 1 : i);
            }

            return { ...q, options: newOpts, correctIndex: newCorrectIndex, correctIndices: newCorrectIndices };
        });
    };

    const handleAddSection = () => {
        const newSection = {
            id: Date.now(),
            title: `Section ${String.fromCharCode(65 + sections.length)}`,
            questions: []
        };

        setSections(prev => [...prev, newSection]);
    };

    const handleAddQuestion = (sectionId) => {
        const newQuestion = {
            id: Date.now(),
            type: "Single Correct",
            difficulty: "Easy",
            marks: 1,
            text: "",
            options: ["", ""],
            correctIndex: null,
            correctIndices: [],
            explanation: "",
            useAnswerExplanation: false,
        };

        setSections(prev =>
            prev.map(sec => sec.id === sectionId
                ? { ...sec, questions: [...sec.questions, newQuestion] }
                : sec
            )
        );
        setSelected({ sectionId, questionId: newQuestion.id });
    };

    const handleSave = async () => {
        setError("");

        for (let sec of sections) {
            for (let q of sec.questions) {
                if (!q.text.trim()) {
                    setError("Question text cannot be empty.");

                    return;
                }

                const filteredOptions = q.options.filter(opt => opt.trim() !== "");

                if (filteredOptions.length === 0) {

                    setError("Options cannot be empty.");

                    return;
                }

                if (filteredOptions.length !== q.options.length) {
                    setError("Options cannot have empty values.");

                    return;
                }

                if (q.type === "Single Correct" && q.correctIndex === null) {
                    setError("Single Correct questions must have one correct option selected.");

                    return;
                }

                if (q.type === "Multiple Correct" && (!q.correctIndices.length)) {
                    setError("Multiple Correct questions must have at least one correct option selected.");

                    return;
                }

                if (q.useAnswerExplanation && !q.explanation.trim()) {
                    setError("Answer explanation is enabled and cannot be empty.");

                    return;
                }
            }
        }

        try {
            const payload = sections.flatMap(sec =>
                sec.questions.map(q => {
                    const filteredOptions = q.options.filter(opt => opt.trim() !== "");
                    let correctAnswerStr;

                    if (q.type === "Single Correct") {
                        correctAnswerStr = (q.correctIndex !== null) ? String(q.correctIndex + 1) : null;
                    } else {
                        correctAnswerStr = q.correctIndices
                            .map(i => i + 1)
                            .join(",");
                    }

                    const base = {
                        question: q.text,
                        difficulty: Object.keys(difficultyMap).find(key => difficultyMap[key] === q.difficulty) || 1,
                        options: filteredOptions,
                        correct_answer: correctAnswerStr,
                        explanation: q.explanation
                    };

                    if (q._id) {
                        return { _id: q._id, ...base };
                    }

                    return base;
                })
            );

            // Save current selection
            const currentSelection = { ...selected };

            const res = await fetch(`${API_URL}/company/quiz/question/${mId}/${aId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ data: payload })
            });

            if (!res.ok) throw new Error("Failed to save");

            // Reload data but keep selection
            await fetchQuestion(currentSelection);

            toast.success("Quiz saved successfully");
            setError("");
        } catch (err) {
            console.error(err);
            setError("Save failed. Please try again.");
        }
    };

    const current = getSelectedQuestion();

    // Skeleton count helper
    const skeletonCount = 4;

    return (
        <Box display="flex" height="100vh">

            <Box flex={1} p={2} borderRight="1px solid #ddd" height="100vh" overflow="auto">
                <Button variant="contained" fullWidth onClick={() => router.replace(`/${lang}/apps/activity/${mId}`)} sx={{ mb: 4 }}>
                    Back
                </Button>
                <Button variant="contained" fullWidth onClick={handleAddSection} sx={{ mb: 4 }}>
                    Add Section
                </Button>

                {loading && sections.length === 0 ? (
                    <>
                        {[...Array(skeletonCount)].map((_, i) => (
                            <Box key={i} mb={2}>
                                <Skeleton variant="text" width="60%" height={30} />
                                {[...Array(2)].map((__, j) => (
                                    <Skeleton key={j} variant="rectangular" height={40} sx={{ mt: 1 }} />
                                ))}
                            </Box>
                        ))}
                    </>
                ) : (
                    sections.map(section => {
                        const isEditing = editingSectionId === section.id;

                        return (
                            <Paper key={section.id} sx={{ p: 2, mb: 2 }}>
                                {!isEditing ? (
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography fontWeight="bold" sx={{ userSelect: "none" }}>{section.title || "(No Title)"}</Typography>
                                        <Button size="small" onClick={() => {
                                            setEditingSectionId(section.id);
                                            setTempSectionTitle(section.title);
                                        }}>
                                            Edit
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <TextField
                                            size="small"
                                            value={tempSectionTitle}
                                            onChange={(e) => setTempSectionTitle(e.target.value)}
                                            fullWidth
                                            autoFocus
                                        />
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => {
                                                setSections(prev =>
                                                    prev.map(s => s.id === section.id
                                                        ? { ...s, title: tempSectionTitle.trim() || "(No Title)" }
                                                        : s
                                                    )
                                                );
                                                setEditingSectionId(null);
                                            }}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setEditingSectionId(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                )}

                                {section.questions.map((q, idx) => (
                                    <Paper
                                        key={q.id}
                                        sx={{
                                            p: 1,
                                            mt: 1,
                                            bgcolor: selected.sectionId === section.id && selected.questionId === q.id ? "#e3f2fd" : "white",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => setSelected({ sectionId: section.id, questionId: q.id })}
                                    >
                                        <Typography variant="caption" sx={{ userSelect: "none" }}>
                                            {q.type} {difficultyIcons[q.difficulty]} {q.difficulty}
                                        </Typography>
                                        <Typography>{`${idx + 1}. ${q.text || ""}`} </Typography>
                                    </Paper>
                                ))}
                                <Button size="small" onClick={() => handleAddQuestion(section.id)} sx={{ mt: 1 }} variant="outlined">
                                    Add Question
                                </Button>
                            </Paper>
                        );
                    })
                )}
            </Box>

            <Box flex={2} p={2} height="100vh" overflow="auto">
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading && sections.length === 0 ? (
                    <Box>
                        <Skeleton variant="text" width="40%" height={40} />
                        <Skeleton variant="rectangular" height={150} sx={{ mt: 2, mb: 2 }} />
                        <Skeleton variant="text" width="30%" height={30} />
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} variant="rectangular" height={50} sx={{ mt: 1 }} />
                        ))}
                        <Skeleton variant="rectangular" height={36} width={120} sx={{ mt: 3 }} />
                    </Box>
                ) : current ? (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Edit Question</Typography>

                        <Select
                            size="small"
                            value={current.type}
                            onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "type", e.target.value)}
                            sx={{ mt: 1 }}
                        >
                            <MenuItem value="Single Correct">Single Correct</MenuItem>
                            <MenuItem value="Multiple Correct">Multiple Correct</MenuItem>
                        </Select>

                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            value={current.text}
                            onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "text", e.target.value)}
                            sx={{ mt: 2 }}
                            placeholder="Enter question text"
                        />

                        <Typography sx={{ mt: 2 }}>Difficulty {difficultyIcons[current.difficulty]}</Typography>
                        <Select
                            size="small"
                            value={current.difficulty}
                            onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "difficulty", e.target.value)}
                        >
                            <MenuItem value="Easy">Easy</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Hard">Hard</MenuItem>
                        </Select>

                        <Typography sx={{ mt: 2 }}>Options</Typography>
                        {current.options.map((opt, i) => {
                            const checked = current.type === "Single Correct"
                                ? current.correctIndex === i
                                : (current.correctIndices || []).includes(i);

                            return (
                                <Box key={i} display="flex" alignItems="center" gap={1} mt={1}>
                                    <Checkbox checked={checked} onChange={() => handleSelectOption(i)} />
                                    <TextField
                                        value={opt}
                                        onChange={(e) => handleUpdateOption(i, e.target.value)}
                                        fullWidth
                                        placeholder={`Option ${i + 1}`}
                                    />
                                    <Button color="error" onClick={() => handleRemoveOption(i)}>Delete</Button>
                                </Box>
                            );
                        })}
                        <Button onClick={handleAddOption} sx={{ mt: 1 }}>Add Option</Button>

                        <Box mt={3} display="flex" alignItems="center" gap={1}>
                            <Checkbox
                                checked={current.useAnswerExplanation}
                                onChange={(e) =>
                                    handleUpdateQuestionField(selected.sectionId, selected.questionId, "useAnswerExplanation", e.target.checked)
                                }
                            />
                            <Typography>Use Answer Explanation in validation</Typography>
                        </Box>

                        {current.useAnswerExplanation && (
                            <>
                                <Typography sx={{ mt: 2 }}>Answer Explanation</Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={current.explanation}
                                    onChange={(e) => handleUpdateQuestionField(selected.sectionId, selected.questionId, "explanation", e.target.value)}
                                    placeholder="Enter answer explanation"
                                    sx={{ mt: 1 }}
                                />
                            </>
                        )}
                    </Paper>
                ) : (
                    <Typography>Select a question to edit</Typography>
                )}

                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSave}
                    sx={{ mt: 2 }}
                >
                    Save
                </Button>
            </Box>
        </Box>
    );
};

export default QueastionQuizPage;
