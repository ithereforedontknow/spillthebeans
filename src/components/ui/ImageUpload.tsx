import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { uploadSpotImage } from '@/lib/supabase/queries'
import { useToast } from './Toast'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  spotId: string
  currentUrl?: string | null
  onUploaded: (url: string) => void
  className?: string
}

export function ImageUpload({ spotId, currentUrl, onUploaded, className }: ImageUploadProps) {
  const toast     = useToast()
  const inputRef  = useRef<HTMLInputElement>(null)
  const [preview,   setPreview]   = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [dragging,  setDragging]  = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast('Only image files are allowed.', 'err'); return }
    if (file.size > 5 * 1024 * 1024)    { toast('Image must be under 5 MB.', 'err'); return }

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const url = await uploadSpotImage(file, spotId)
      onUploaded(url)
      toast('Image uploaded.')
    } catch (err: any) {
      toast(err.message ?? 'Upload failed.', 'err')
      setPreview(currentUrl ?? null)
    } finally {
      setUploading(false)
    }
  }, [spotId, currentUrl, onUploaded, toast])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onUploaded('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onInputChange}
        className="hidden"
      />

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative border rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
          'flex items-center justify-center',
          preview ? 'aspect-video' : 'h-36',
          dragging
            ? 'border-amber bg-amber/5'
            : 'border-border hover:border-muted bg-raised',
          uploading && 'pointer-events-none'
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Spot preview" className="w-full h-full object-cover" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-base/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="font-mono text-xs text-head flex items-center gap-1.5">
                <Upload size={13} />Replace
              </span>
            </div>
            {/* Clear button */}
            {!uploading && (
              <button
                onClick={clear}
                className="absolute top-2 right-2 w-6 h-6 bg-base/80 rounded flex items-center justify-center text-dim hover:text-head transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-dim">
            <ImageIcon size={22} strokeWidth={1.5} />
            <p className="font-mono text-xs">Drop image or click to upload</p>
            <p className="font-mono text-2xs text-dim/60">JPEG, PNG, WebP — max 5 MB</p>
          </div>
        )}

        {/* Upload spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-base/70 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-amber" />
            <span className="font-mono text-xs text-amber">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  )
}
