

import React, { useState, useRef, useCallback } from 'react';
// Fix: Import GoogleGenAI and Modality according to the coding guidelines.
import { GoogleGenAI, Modality } from '@google/genai';

// Components
import CanvasPreview from './components/CanvasPreview';
import CollapsibleSection from './components/CollapsibleSection';
import UploadZone from './components/UploadZone';
import MaskBrushPanel from './components/MaskBrushPanel';
import PropsUploader from './components/PropsUploader';
import PropsList from './components/PropsList';
import MatchPanel from './components/MatchPanel';
import RestoreBrushPanel from './components/RestoreBrushPanel';
// Fix: Import RestoreIcon to be used in the "Restore Original" section.
import { AdjustIcon, ChecklistIcon, GenerateIcon, MaskIcon, PropsIcon, TrashIcon, DownloadIcon, RestoreIcon } from './components/Icons';

// Utils & Types
import { processPropImage, fileToDataURL } from './utils/imageProcessor';
import { Prop } from './types';

// Main component
const App: React.FC = () => {
    // State for main image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [originalImageDataUrl, setOriginalImageDataUrl] = useState<string | null>(null);

    // State for image generation
    const [prompt, setPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // State for masking
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [brushSize, setBrushSize] = useState<number>(30);
    const [isErasing, setIsErasing] = useState<boolean>(false);

    // State for props
    const [props, setProps] = useState<Prop[]>([]);
    const [propsUploadError, setPropsUploadError] = useState<string | null>(null);
    const [isProcessingProps, setIsProcessingProps] = useState<boolean>(false);
    const [activePropId, setActivePropId] = useState<string | null>(null);

    // State for prop matching
    const [matchSettings, setMatchSettings] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
    });

    // State for restore brush
    const [restoreBrushSize, setRestoreBrushSize] = useState<number>(30);
    const [isRestoring, setIsRestoring] = useState<boolean>(false);

    // State for accordion
    const [openSection, setOpenSection] = useState<number>(1);

    const clearMask = useCallback(() => {
        const canvas = maskCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, []);
    
    const handleImageUpload = useCallback((file: File) => {
        setUploadError(null);
        setGenerationError(null);
        clearMask();
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setImageSrc(dataUrl);
            setOriginalImageDataUrl(dataUrl); // Save original for restoration
        };
        reader.readAsDataURL(file);
    }, [clearMask]);
    
    const handleRestoreAll = useCallback(() => {
        if (!originalImageDataUrl) return;
        setImageSrc(originalImageDataUrl);
        
        fetch(originalImageDataUrl)
            .then(res => res.blob())
            .then(blob => {
                const restoredFile = new File([blob], 'restored-image.png', { type: 'image/png' });
                setImageFile(restoredFile);
            });
        
        clearMask();
    }, [originalImageDataUrl, clearMask]);

    const handlePropsUpload = useCallback(async (files: File[]) => {
        setPropsUploadError(null);
        setIsProcessingProps(true);
        try {
            const newPropsPromises = files.map(file => processPropImage(file));
            const newProps = await Promise.all(newPropsPromises);
            setProps(prev => [...prev, ...newProps]);
        } catch (err) {
            console.error(err);
            setPropsUploadError('Failed to process one or more props.');
        } finally {
            setIsProcessingProps(false);
        }
    }, []);

    const handleDeleteProp = useCallback((id: string) => {
        setProps(prev => prev.filter(p => p.id !== id));
        if (activePropId === id) {
            setActivePropId(null);
        }
    }, [activePropId]);

    const handleSelectProp = useCallback((id: string) => {
        setActivePropId(id);
        const selectedProp = props.find(p => p.id === id);
        if (selectedProp) {
            const propName = selectedProp.originalFile.name.split('.')[0].replace(/[-_]/g, ' ');
            setPrompt(p => `Add a ${propName} to the masked area${p ? `, and also ${p}` : ''}`);
        }
    }, [props]);

    const handleToggleBg = useCallback(async (id: string) => {
        const propToUpdate = props.find(p => p.id === id);
        if (!propToUpdate) return;

        setIsProcessingProps(true);
        try {
            // Re-process with background removal forced
            const updatedProp = await processPropImage(propToUpdate.originalFile, true);
            // Replace the old prop with the updated one, keeping the same ID
            setProps(prev => prev.map(p => p.id === id ? { ...updatedProp, id: p.id } : p));
        } catch (err) {
            console.error(err);
            setPropsUploadError('Failed to re-process prop.');
        } finally {
            setIsProcessingProps(false);
        }
    }, [props]);

    const handleGenerate = async () => {
        if (!imageFile) {
            setGenerationError('Please upload a base image first.');
            return;
        }

        setIsGenerating(true);
        setGenerationError(null);

        try {
            // Fix: Adhere to the coding guidelines for API key usage.
            // The API key must be obtained from `process.env.API_KEY`.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const imageSrcDataUrl = await fileToDataURL(imageFile);
            const base64ImageData = imageSrcDataUrl.split(',')[1];
            
            const parts: any[] = [];
            
            const maskCanvas = maskCanvasRef.current;
            if (maskCanvas) {
                const isMaskEmpty = !maskCanvas.getContext('2d')?.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data.some(channel => channel !== 0);
                if (!isMaskEmpty) {
                    const maskDataUrl = maskCanvas.toDataURL('image/png');
                    const base64MaskData = maskDataUrl.split(',')[1];
                    parts.push({
                        inlineData: { data: base64MaskData, mimeType: 'image/png' }
                    });
                }
            }
            
            parts.push({ inlineData: { data: base64ImageData, mimeType: imageFile.type } });
            parts.push({ text: prompt || 'Fill in the masked area plausibly.' });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            let foundImage = false;
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setImageSrc(imageUrl); 
                    
                    const res = await fetch(imageUrl);
                    const blob = await res.blob();
                    const newFile = new File([blob], 'generated-image.png', { type: 'image/png' });
                    setImageFile(newFile);

                    clearMask();
                    foundImage = true;
                    break; 
                }
            }

            if (!foundImage) {
                setGenerationError('The model did not return an image. Please try a different prompt.');
            }

        } catch (error) {
            console.error('Error generating image:', error);
            setGenerationError('An error occurred during generation. Check the console for details.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleClearAll = () => {
        setImageFile(null);
        setImageSrc(null);
        setUploadError(null);
        setOriginalImageDataUrl(null);
        setPrompt('');
        setIsGenerating(false);
        setGenerationError(null);
        clearMask();
        setProps([]);
        setPropsUploadError(null);
        setIsProcessingProps(false);
        setActivePropId(null);
        setOpenSection(1);
    };

    const downloadImage = () => {
        if (!imageSrc) return;
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = 'edited-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="bg-gray-900 text-white min-h-screen flex font-sans">
            <aside className="w-[350px] bg-gray-800 flex flex-col h-screen border-r border-gray-700">
                <header className="p-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-center">AI Prop Inpainter</h1>
                </header>
                
                <div className="flex-grow overflow-y-auto p-4 pb-6 space-y-3">
                    <CollapsibleSection 
                        title="1. Base Image" 
                        icon={<ChecklistIcon />} 
                        isOpen={openSection === 1}
                        onToggle={() => setOpenSection(openSection === 1 ? 0 : 1)}
                    >
                        <div className="p-4">
                            <UploadZone 
                                onFileUpload={handleImageUpload}
                                onError={setUploadError}
                                error={uploadError}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection 
                        title="2. Mask Area" 
                        icon={<MaskIcon />}
                        isOpen={openSection === 2}
                        onToggle={() => setOpenSection(openSection === 2 ? 0 : 2)}
                    >
                        <MaskBrushPanel 
                            brushSize={brushSize}
                            setBrushSize={setBrushSize}
                            isErasing={isErasing}
                            setIsErasing={setIsErasing}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection 
                        title="3. Add Props" 
                        icon={<PropsIcon />}
                        isOpen={openSection === 3}
                        onToggle={() => setOpenSection(openSection === 3 ? 0 : 3)}
                    >
                        <div className="p-4 space-y-3">
                            <PropsUploader 
                                onUpload={handlePropsUpload}
                                onError={setPropsUploadError}
                                error={propsUploadError}
                                isProcessing={isProcessingProps}
                            />
                            <PropsList 
                                props={props}
                                activePropId={activePropId}
                                onDelete={handleDeleteProp}
                                onSelect={handleSelectProp}
                                onToggleBg={handleToggleBg}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection 
                        title="4. Adjust Match" 
                        icon={<AdjustIcon />}
                        isOpen={openSection === 4}
                        onToggle={() => setOpenSection(openSection === 4 ? 0 : 4)}
                    >
                        <MatchPanel settings={matchSettings} onChange={setMatchSettings} />
                    </CollapsibleSection>

                    <CollapsibleSection 
                        title="5. Restore Original" 
                        icon={<RestoreIcon />}
                        isOpen={openSection === 5}
                        onToggle={() => setOpenSection(openSection === 5 ? 0 : 5)}
                    >
                        <RestoreBrushPanel 
                            brushSize={restoreBrushSize}
                            setBrushSize={setRestoreBrushSize}
                            isRestoring={isRestoring}
                            setIsRestoring={setIsRestoring}
                            onRestoreAll={handleRestoreAll}
                        />
                    </CollapsibleSection>
                </div>

                <footer className="p-4 border-t border-gray-700 space-y-3">
                    <div className="space-y-1">
                        <label htmlFor="prompt" className="text-sm font-medium text-gray-300">
                            Prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'add a cat wearing sunglasses'"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !imageFile}
                        className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors"
                    >
                        {isGenerating ? (
                            <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <GenerateIcon className="w-4 h-4 mr-2" />
                                <span>Generate</span>
                            </>
                        )}
                    </button>
                    {generationError && <p className="text-sm text-red-500 text-center">{generationError}</p>}
                </footer>
            </aside>

            <main className="flex-1 flex flex-col relative">
                <CanvasPreview 
                    imageSrc={imageSrc}
                    maskCanvasRef={maskCanvasRef}
                    brushSize={isRestoring ? restoreBrushSize : brushSize}
                    isErasing={isErasing}
                    isRestoring={isRestoring}
                    onCanvasReady={() => {}}
                    clearMask={clearMask}
                />
                
                {imageSrc && (
                    <div className="absolute top-4 right-4 flex space-x-2">
                         <button 
                            onClick={downloadImage}
                            className="p-2 bg-gray-800 bg-opacity-80 rounded-lg text-gray-300 hover:bg-gray-700"
                            title="Download Image"
                        >
                            <DownloadIcon />
                        </button>
                        <button 
                            onClick={handleClearAll}
                            className="p-2 bg-gray-800 bg-opacity-80 rounded-lg text-red-400 hover:bg-red-800 hover:text-red-300"
                            title="Clear All"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;