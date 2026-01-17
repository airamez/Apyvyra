import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  ImageList,
  ImageListItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { type ProductUrl } from '../../services/productService';
import { useTranslation } from '../../hooks/useTranslation';

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productDescription?: string;
  images: ProductUrl[];
}

export default function ImageGalleryModal({
  open,
  onClose,
  productName,
  productDescription,
  images,
}: ImageGalleryModalProps) {
  const { t } = useTranslation('Store');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const selectedImage = images[selectedIndex];

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setImagePosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleImageClick = useCallback(() => {
    if (zoomLevel < 3) {
      setZoomLevel(prev => Math.min(prev + 0.5, 3));
    } else {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  }, [zoomLevel, imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(0);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '95vw',
          height: '95vh',
          maxWidth: '95vw',
          maxHeight: '95vh',
          m: 1,
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        pb: 1,
        borderBottom: '1px solid #eee',
      }}>
        <Box sx={{ flex: 1, pr: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {productName}
          </Typography>
          {productDescription && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {productDescription}
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
        {/* Main Image Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            minHeight: 0,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage.url}
              alt={selectedImage.altText || productName}
              onClick={handleImageClick}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                userSelect: 'none',
                pointerEvents: zoomLevel > 1 ? 'none' : 'auto',
              }}
              draggable={false}
            />
          )}
          
          {/* Zoom Controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              gap: 1,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 1,
              p: 0.5,
              boxShadow: 1,
            }}
          >
            <IconButton 
              size="small" 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              title={t('ZOOM_OUT') || 'Zoom Out'}
            >
              <ZoomOutIcon />
            </IconButton>
            <Typography sx={{ display: 'flex', alignItems: 'center', px: 1, minWidth: 50, justifyContent: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              title={t('ZOOM_IN') || 'Zoom In'}
            >
              <ZoomInIcon />
            </IconButton>
          </Box>

          {/* Zoom Instructions */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 1,
              p: 1,
              boxShadow: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {t('ZOOM_HINT') || 'Click image to zoom in/out. Drag to pan when zoomed.'}
            </Typography>
          </Box>
        </Box>

        {/* Thumbnails */}
        <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
          <ImageList
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              gap: 1,
              m: 0,
              pb: 1,
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: '#f1f1f1',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#888',
                borderRadius: 4,
                '&:hover': {
                  bgcolor: '#555',
                },
              },
            }}
            cols={images.length}
            rowHeight={80}
          >
            {images.map((image, index) => (
              <ImageListItem
                key={image.id}
                onClick={() => handleThumbnailClick(index)}
                sx={{
                  cursor: 'pointer',
                  width: 100,
                  minWidth: 100,
                  height: 80,
                  border: selectedIndex === index ? '3px solid' : '1px solid',
                  borderColor: selectedIndex === index ? 'primary.main' : '#ddd',
                  borderRadius: 1,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: selectedIndex === index ? 'primary.main' : 'primary.light',
                  },
                }}
              >
                <Box
                  component="img"
                  src={image.url}
                  alt={image.altText || `${productName} - ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    bgcolor: '#f9f9f9',
                    p: 0.5,
                  }}
                  loading="lazy"
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
