import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomInIcon, ZoomOutIcon, FitToScreenIcon, RestoreIcon } from './Icons';

interface CanvasPreviewProps {
  imageSrc: string | null;
  maskCanvasRef: React.RefObject<HTMLCanvasElement>;
  brushSize: number;
  isErasing: boolean;
  isRestoring?: boolean;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  clearMask: () => void;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({ 
  imageSrc, 
  maskCanvasRef, 
  brushSize, 
  isErasing,
  isRestoring,
  onCanvasReady,
  clearMask
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const previousImageSrc = useRef<string | null>(null);

  useEffect(() => {
    if (imageSrc) {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        
        // Solo actualizar la imagen original si es completamente nueva
        // NO cuando se genera una nueva imagen (para permitir restauración)
        if (!originalImageRef.current || (previousImageSrc.current === null)) {
          originalImageRef.current = image;
        }
        
        if (imageCanvasRef.current) {
            onCanvasReady(imageCanvasRef.current);
        }
      };
      image.src = imageSrc;
      previousImageSrc.current = imageSrc;
    } else {
      setImg(null);
      originalImageRef.current = null;
      previousImageSrc.current = null;
    }
  }, [imageSrc, onCanvasReady]);

  const redraw = useCallback(() => {
    if (!img || !imageCanvasRef.current || !containerRef.current) return;
    
    const imageCanvas = imageCanvasRef.current;
    const container = containerRef.current;

    const { clientWidth, clientHeight } = container;
    imageCanvas.width = clientWidth;
    imageCanvas.height = clientHeight;

    const imageCtx = imageCanvas.getContext('2d');
    if (!imageCtx) return;

    imageCtx.save();
    imageCtx.clearRect(0, 0, clientWidth, clientHeight);
    imageCtx.translate(transform.x, transform.y);
    imageCtx.scale(transform.scale, transform.scale);
    imageCtx.drawImage(img, 0, 0);
    imageCtx.restore();
    
  }, [img, transform]);
  
  const fitToScreen = useCallback(() => {
    if (!img || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = clientWidth / img.width;
    const scaleY = clientHeight / img.height;
    const scale = Math.min(scaleX, scaleY, 1);
    const x = (clientWidth - img.width * scale) / 2;
    const y = (clientHeight - img.height * scale) / 2;
    setTransform({ x, y, scale });
  }, [img]);

  useEffect(() => {
    if (img) {
      fitToScreen();
    }
    // ARREGLADO: NO llamar clearMask() aquí automáticamente
  }, [img, fitToScreen]);
  
  useEffect(() => {
    redraw();
  }, [redraw, transform]);

  useEffect(() => {
    const handleResize = () => {
      fitToScreen();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToScreen]);

  useEffect(() => {
    if (maskCanvasRef.current && imageCanvasRef.current) {
      maskCanvasRef.current.width = imageCanvasRef.current.width;
      maskCanvasRef.current.height = imageCanvasRef.current.height;
    }
  }, [transform, maskCanvasRef]);


  const getTransformedMousePos = (e: React.MouseEvent) => {
    const rect = imageCanvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const invX = (x - transform.x) / transform.scale;
    const invY = (y - transform.y) / transform.scale;
    
    return { x: invX, y: invY };
  };
  
  // ARREGLADO: Función de restauración mejorada
  const restoreAtPosition = (x: number, y: number) => {
    const canvas = imageCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const originalImg = originalImageRef.current;

    if (!ctx || !canvas || !originalImg || !img) return;

    const radius = (brushSize / 2);
    
    // Calcular las coordenadas en el espacio del canvas transformado
    const canvasX = transform.x + x * transform.scale;
    const canvasY = transform.y + y * transform.scale;
    
    ctx.save();
    
    // Crear un círculo de clipping
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
    ctx.clip();
    
    // Limpiar el área
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redibujar la imagen original en esa área
    ctx.drawImage(
      originalImg, 
      transform.x, 
      transform.y, 
      originalImg.width * transform.scale, 
      originalImg.height * transform.scale
    );
    
    ctx.restore();
    
    // Redibujar el resto de la imagen actual fuera del círculo
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(
      img, 
      transform.x, 
      transform.y, 
      img.width * transform.scale, 
      img.height * transform.scale
    );
    ctx.restore();
  };
  
  const drawOnMask = (x: number, y: number) => {
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    if (!maskCtx) return;
    
    maskCtx.save();
    maskCtx.translate(transform.x, transform.y);
    maskCtx.scale(transform.scale, transform.scale);
    
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / (2 * transform.scale), 0, Math.PI * 2);
    maskCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    maskCtx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    maskCtx.fill();

    maskCtx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) {
        setIsPanning(true);
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0) {
      setIsDrawing(true);
      const pos = getTransformedMousePos(e);
      // ARREGLADO: Verificar correctamente el modo de restauración
      if (isRestoring) {
          restoreAtPosition(pos.x, pos.y);
      } else {
          drawOnMask(pos.x, pos.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    } else if (isDrawing) {
      const pos = getTransformedMousePos(e);
      // ARREGLADO: Verificar correctamente el modo de restauración
      if (isRestoring) {
          restoreAtPosition(pos.x, pos.y);
      } else {
          drawOnMask(pos.x, pos.y);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = 1.1;
    const newScale = e.deltaY < 0 ? transform.scale * scaleAmount : transform.scale / scaleAmount;
    setTransform(t => ({ ...t, scale: Math.max(0.1, Math.min(newScale, 10)) }));
  };
  
  const handleZoom = (direction: 'in' | 'out') => {
    const scaleAmount = 1.2;
    const newScale = direction === 'in' ? transform.scale * scaleAmount : transform.scale / scaleAmount;
    setTransform(t => ({ ...t, scale: Math.max(0.1, Math.min(newScale, 10)) }));
  };

  return (
    <div className="relative w-full h-full bg-gray-900 flex-grow" ref={containerRef}>
        {!imageSrc && (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                <p>Upload an image to get started</p>
            </div>
        )}
      <div className="relative w-full h-full overflow-hidden" 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : (imageSrc ? (isRestoring ? 'cell' : 'crosshair') : 'default') }}
      >
        <canvas ref={imageCanvasRef} className="absolute top-0 left-0" />
        <canvas ref={maskCanvasRef} className="absolute top-0 left-0 opacity-50 pointer-events-none" />
      </div>
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-gray-800 bg-opacity-80 p-2 rounded-lg">
          <button onClick={() => handleZoom('in')} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md"><ZoomInIcon /></button>
          <button onClick={() => handleZoom('out')} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md"><ZoomOutIcon /></button>
          <button onClick={fitToScreen} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md"><FitToScreenIcon /></button>
          <div className="h-5 w-px bg-gray-600"></div>
          <button onClick={clearMask} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md" title="Clear mask"><RestoreIcon /></button>
      </div>
    </div>
  );
};

export default CanvasPreview;