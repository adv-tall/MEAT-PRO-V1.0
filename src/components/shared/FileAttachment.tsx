import React, { useState, useRef } from 'react';
import { Paperclip, X, File, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface FileAttachmentProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export function FileAttachment({
  onFileSelect,
  accept = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 5,
  label = "Attach File"
}: FileAttachmentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {!selectedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-accent hover:bg-orange-50/30 transition-all group"
        >
          <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-accent transition-colors shadow-sm">
            <Paperclip size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Max {maxSizeMB}MB</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept={accept} 
            onChange={handleFileChange} 
          />
        </div>
      ) : (
        <div className="relative p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-slate-100" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
              <File size={24} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-wider truncate">{selectedFile.name}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>

          <button 
            onClick={removeFile}
            className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1">{error}</p>
      )}
    </div>
  );
}
