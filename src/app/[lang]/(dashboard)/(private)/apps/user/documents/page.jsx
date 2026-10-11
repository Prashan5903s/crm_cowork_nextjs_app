'use client';

import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";

import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    alpha,
} from "@mui/material";

import Grid from "@mui/material/Grid2";

import SearchIcon from "@mui/icons-material/Search";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import ArticleIcon from "@mui/icons-material/Article";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import formatTime from "@/utils/formatTime";

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL

const documentTypeData = [
    { value: "1", label: "Bye-laws" },
    { value: "2", label: "AGM Minutes" },
    { value: "3", label: "Meeting Documents" },
    { value: "4", label: "Circulars" },
    { value: "5", label: "NOC Forms" },
    { value: "6", label: "Insurance Documents" },
    { value: "7", label: "Download Center" },
];

// ---- File-type helpers -----------------------------------------------

const getFileExtension = (fileName = "") => {
    const match = fileName.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : "";
};

const FILE_CATEGORY = {
    image: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
    pdf: ["pdf"],
    word: ["doc", "docx"],
    excel: ["xls", "xlsx", "csv"],
    powerpoint: ["ppt", "pptx"],
    text: ["txt", "md", "log", "json", "xml"],
    video: ["mp4", "webm", "ogg", "mov"],
    audio: ["mp3", "wav", "m4a", "aac"],
};

const getFileCategory = (fileName = "") => {
    const ext = getFileExtension(fileName);
    for (const [category, extensions] of Object.entries(FILE_CATEGORY)) {
        if (extensions.includes(ext)) return category;
    }
    return "other";
};

const getFileIcon = (fileName = "") => {
    const category = getFileCategory(fileName);
    switch (category) {
        case "image":
            return <ImageIcon color="error" />;
        case "pdf":
            return <PictureAsPdfIcon color="error" />;
        case "word":
            return <ArticleIcon color="error" />;
        case "excel":
            return <TableChartIcon color="error" />;
        case "powerpoint":
            return <SlideshowIcon color="error" />;
        case "video":
            return <VideoLibraryIcon color="error" />;
        case "audio":
            return <AudiotrackIcon color="error" />;
        default:
            return <DescriptionIcon color="error" />;
    }
};

// Microsoft Office Online viewer works for docx/xlsx/pptx, but only
// against a publicly reachable URL (won't work on localhost).
const getOfficeViewerUrl = (fileUrl) =>
    `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

// Google Docs viewer as a fallback/alternative for the same file types.
const getGoogleViewerUrl = (fileUrl) =>
    `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;

// ---- Preview Modal -----------------------------------------------------

const ViewModalComponent = ({ previewOpen, handleClosePreview, selectedFile, handleDownload }) => {

    if (!selectedFile) return null;

    const fileUrl = `${ASSET_URL}/documents/${selectedFile.file_name}`;
    const category = getFileCategory(selectedFile.file_name);

    const renderPreview = () => {
        switch (category) {
            case "image":
                return (
                    <img
                        src={fileUrl}
                        alt="Document"
                        style={{
                            width: "100%",
                            maxHeight: "75vh",
                            objectFit: "contain",
                            display: "block",
                            margin: "0 auto",
                        }}
                    />
                );

            case "pdf":
                return (
                    <iframe
                        src={fileUrl}
                        title={selectedFile.document_name}
                        width="100%"
                        height="700"
                        style={{ border: 0 }}
                    />
                );

            case "word":
            case "excel":
            case "powerpoint":
                return (
                    <iframe
                        src={getOfficeViewerUrl(fileUrl)}
                        title={selectedFile.document_name}
                        width="100%"
                        height="700"
                        style={{ border: 0 }}
                    />
                );

            case "text":
                return (
                    <iframe
                        src={fileUrl}
                        title={selectedFile.document_name}
                        width="100%"
                        height="500"
                        style={{ border: "1px solid", borderColor: "divider", borderRadius: 4 }}
                    />
                );

            case "video":
                return (
                    <video
                        src={fileUrl}
                        controls
                        style={{ width: "100%", maxHeight: "75vh" }}
                    />
                );

            case "audio":
                return (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <audio src={fileUrl} controls style={{ width: "100%" }} />
                    </Box>
                );

            default:
                return (
                    <Box sx={{ p: 5, textAlign: "center" }}>
                        <Typography>
                            Preview is not available for this file type.
                        </Typography>

                        <Button
                            sx={{ mt: 2 }}
                            variant="contained"
                            onClick={() => handleDownload(selectedFile)}
                        >
                            Download File
                        </Button>
                    </Box>
                );
        }
    };

    return (
        <Dialog
            open={previewOpen}
            onClose={handleClosePreview}
            maxWidth="lg"
            fullWidth
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <DialogCloseButton onClick={handleClosePreview}><i className="tabler-x" /></DialogCloseButton>
            <DialogTitle>
                {selectedFile?.document_name}
            </DialogTitle>

            <DialogContent dividers sx={{ p: 6 }}>
                {renderPreview()}

                {/* Fallback note for Office docs, since the online viewer needs a public URL */}
                {(category === "word" || category === "excel" || category === "powerpoint") && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 2, textAlign: "center" }}
                    >
                        If the preview does not load (common on localhost/private URLs),{" "}
                        <Button
                            size="small"
                            onClick={() => window.open(getGoogleViewerUrl(fileUrl), "_blank")}
                        >
                            try Google Docs viewer
                        </Button>{" "}
                        or download the file instead.
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}>

                <Button
                    onClick={() => handleDownload(selectedFile)}
                    variant="contained"
                    startIcon={<DownloadIcon />}
                >
                    Download
                </Button>

                <Button
                    variant="outlined"
                    onClick={handleClosePreview}
                >
                    Close
                </Button>

            </DialogActions>

        </Dialog>
    )
}

const UserDocumentsPage = () => {

    const { data: session } = useSession();
    const token = session?.user?.token;

    const [searchQuery, setSearchQuery] = useState("");
    const [documentData, setDocumentData] = useState();
    const [selectedCategory, setSelectedCategory] = useState(documentTypeData[0]?.value || "");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [loading, setLoading] = useState(true);

    const fetchDocumentData = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/user/document/user/data`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            const data = await response.json();

            if (response.ok) {

                console.log("Fetched document data:", data?.data);
                setDocumentData(data?.data);
            }
        } catch (error) {

            console.error("Error fetching document data:", error);
        } finally {

            setLoading(false);
        }
    }

    useEffect(() => {

        if (API_URL && token) {

            fetchDocumentData();
        }
    }, [API_URL, token]);

    const filteredDocuments = documentData
        ?.filter(group => {
            if (searchQuery.trim()) {
                return (
                    group.document_name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                );
            }

            return group.document_type === selectedCategory;
        })
        ?.flatMap(group =>
            group.documents.map(file => ({
                ...file,
                category: group.document_name,
                document_name: group.document_name,
                created_at: group.created_at,
            }))
        );

    const handlePreview = (file) => {
        setSelectedFile(file);
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
        setSelectedFile(null);
    };

    const handleDownload = async (file) => {
        try {
            const response = await fetch(`${ASSET_URL}/documents/${file.file_name}`);

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            // Preserve the original file extension so the downloaded
            // file opens correctly regardless of document_name.
            const ext = getFileExtension(file.file_name);
            const baseName = file.document_name || "document";
            const hasExt = getFileExtension(baseName) === ext && ext !== "";

            link.href = url;
            link.download = hasExt ? baseName : `${baseName}${ext ? "." + ext : ""}`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <Box sx={{ inlineSize: "100%", px: { xs: 2, md: 4 }, py: 4, overflowX: "hidden" }}>
            <Stack spacing={4}>
                {/* Header */}
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary" letterSpacing="-0.5px">
                        Society Documents
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mt={0.5}>
                        Browse and download official documents, notices, and records uploaded by your society.
                    </Typography>
                </Box>

                {/* Search */}
                <TextField
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents by title, category, or keyword..."
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            backgroundColor: "background.paper",
                            borderRadius: 3,
                            transition: "all 0.2s ease-in-out",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                            "& fieldset": { borderColor: "divider" },
                            "&:hover fieldset": { borderColor: "primary.main" },
                            "&.Mui-focused fieldset": { borderWidth: "2px" },
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Categories Cards Section */}
                <Box>
                    <Typography variant="h6" fontWeight={700} mb={2.5}>
                        Categories
                    </Typography>

                    <Grid container spacing={3}>
                        {documentTypeData?.map((item) => {
                            const isSelected = selectedCategory === item?.value && !searchQuery;
                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.value}>
                                    <Card
                                        elevation={0}
                                        onClick={() => {
                                            setSelectedCategory(item.value);
                                            setSearchQuery(""); // Clear search when switching categories directly
                                        }}
                                        sx={{
                                            height: "100%",
                                            cursor: "pointer",
                                            borderRadius: 3,
                                            border: "2px solid",
                                            borderColor: isSelected ? "primary.main" : "divider",
                                            backgroundColor: isSelected
                                                ? (theme) => alpha(theme.palette.primary.main, 0.03)
                                                : "background.paper",
                                            transition: "all 0.25s ease-in-out",
                                            "&:hover": {
                                                borderColor: "primary.main",
                                                boxShadow: (theme) => `0 10px 25px -5px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                transform: "translateY(-4px)",
                                                "& .category-arrow": {
                                                    transform: "translateX(3px)",
                                                    color: "primary.main",
                                                },
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box
                                                    sx={{
                                                        p: 1.25,
                                                        borderRadius: 2,
                                                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <FolderIcon color="primary" fontSize="medium" />
                                                </Box>

                                                <ArrowForwardIosIcon
                                                    className="category-arrow"
                                                    fontSize="small"
                                                    color="action"
                                                    sx={{
                                                        transition: "all 0.2s ease",
                                                        transform: isSelected ? "rotate(90deg)" : "none"
                                                    }}
                                                />
                                            </Stack>

                                            <Typography mt={2.5} variant="subtitle1" fontWeight={700} color="text.primary">
                                                {item.label}
                                            </Typography>

                                            <Stack direction="row" alignItems="center" justifyContent="space-between" mt="auto" pt={2}>
                                                <Chip
                                                    label={`${documentData?.find(d => d.document_type === item.value)?.documents?.length || 0
                                                        } Files`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600,
                                                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                                        color: "primary.main",
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                    {item.updated}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>

                {/* Documents List View for Selected Category / Search */}
                <Box>
                    <Typography variant="h6" fontWeight={700} mb={2.5}>
                        {searchQuery ? `Search Results (${filteredDocuments?.length})` : `${selectedCategory} Documents`}
                    </Typography>

                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            overflow: "hidden",
                        }}
                    >
                        {loading ? (
                            <List disablePadding>
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <ListItem key={item} sx={{ py: 2, px: 3 }}>
                                        <ListItemIcon>
                                            <Skeleton
                                                variant="rounded"
                                                width={42}
                                                height={42}
                                            />
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Skeleton
                                                    width="45%"
                                                    height={22}
                                                />
                                            }
                                            secondary={
                                                <Skeleton
                                                    width="30%"
                                                    height={18}
                                                />
                                            }
                                        />

                                        <Stack direction="row" spacing={1}>
                                            <Skeleton
                                                variant="circular"
                                                width={36}
                                                height={36}
                                            />
                                            <Skeleton
                                                variant="circular"
                                                width={36}
                                                height={36}
                                            />
                                        </Stack>
                                    </ListItem>
                                ))}
                            </List>
                        ) : filteredDocuments?.length ? (
                            <List disablePadding>
                                {filteredDocuments.map((doc, index) => (
                                    <Box key={index}>
                                        <ListItem
                                            sx={{
                                                py: 2,
                                                px: 3,
                                            }}
                                            secondaryAction={
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handlePreview(doc)}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>

                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleDownload(doc)}
                                                    >
                                                        <DownloadIcon />
                                                    </IconButton>
                                                </Stack>
                                            }
                                        >
                                            <ListItemIcon>
                                                <Box
                                                    sx={{
                                                        p: 1,
                                                        borderRadius: 2,
                                                        bgcolor: (theme) =>
                                                            alpha(
                                                                theme.palette.error.main,
                                                                0.08
                                                            ),
                                                    }}
                                                >
                                                    {getFileIcon(doc?.file_name)}
                                                </Box>
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Typography fontWeight={600}>
                                                        {doc?.document_name || ""}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        {(doc?.file_size / 1024).toFixed(1)} KB
                                                        <br />
                                                        {formatTime(
                                                            doc.created_at
                                                        )}
                                                    </>
                                                }
                                            />
                                        </ListItem>

                                        {index !== filteredDocuments.length - 1 && (
                                            <Divider />
                                        )}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <Box
                                sx={{
                                    p: 6,
                                    textAlign: "center",
                                }}
                            >
                                <Typography color="text.secondary">
                                    No documents available.
                                </Typography>
                            </Box>
                        )}
                    </Card>
                </Box>
            </Stack>
            <ViewModalComponent
                previewOpen={previewOpen}
                handleClosePreview={handleClosePreview}
                selectedFile={selectedFile}
                handleDownload={handleDownload}
            />
        </Box>
    );
};

export default UserDocumentsPage;
