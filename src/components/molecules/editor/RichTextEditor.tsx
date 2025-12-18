'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Heading1, Heading2, Code, ImageIcon, Link2 } from 'lucide-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import Tooltip from '@/components/atoms/Tooltip';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  translations: any;
  variant?: 'full' | 'basic';
  tooltipPosition?: 'top' | 'below' | 'right' | 'bottom-right';
}

export default function RichTextEditor({ content, onChange, placeholder = '내용을 입력하세요...', translations, variant = 'full', tooltipPosition = 'below' }: RichTextEditorProps) {
  const t = translations?.tooltips || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { openLoginPrompt } = useLoginPrompt();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300',
          rel: 'ugc',
          target: '_blank',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${variant === 'basic' ? 'min-h-[180px]' : 'min-h-[260px]'} p-4 text-gray-900 dark:text-white`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 401) {
        openLoginPrompt();
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || '이미지 업로드에 실패했습니다.');
        return;
      }

      editor.chain().focus().setImage({ src: result.data.url }).run();
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }

    // Reset input
    event.target.value = '';
  }, [editor, openLoginPrompt]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl) {
      // Set link
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    } else {
      // Remove link
      editor.chain().focus().unsetLink().run();
    }

    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleLinkButtonClick = useCallback(() => {
    if (!editor) return;

    // Get current link
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkInput(true);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <Tooltip content={t.bold || '굵게'} position={tooltipPosition}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''
            }`}
          >
            <Bold className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </Tooltip>

        {variant === 'full' && (
          <Tooltip content={t.italic || '기울임'} position={tooltipPosition}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''
              }`}
            >
              <Italic className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </Tooltip>
        )}

        {variant === 'full' && (
          <>
            <Tooltip content={t.heading1 || '제목1'} position={tooltipPosition}>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
                }`}
              >
                <Heading1 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </Tooltip>

            <Tooltip content={t.heading2 || '제목2'} position={tooltipPosition}>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 dark:bg-gray-600' : ''
                }`}
              >
                <Heading2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </Tooltip>
          </>
        )}

        <Tooltip content={t.bulletList || '목록'} position={tooltipPosition}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-300 dark:bg-gray-600' : ''
            }`}
          >
            <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </Tooltip>

        {variant === 'full' && (
          <Tooltip content={t.orderedList || '번호 목록'} position={tooltipPosition}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('orderedList') ? 'bg-gray-300 dark:bg-gray-600' : ''
              }`}
            >
              <ListOrdered className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </Tooltip>
        )}

        {variant === 'full' && (
          <Tooltip content={t.codeBlock || '코드 블록'} position={tooltipPosition}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('codeBlock') ? 'bg-gray-300 dark:bg-gray-600' : ''
              }`}
            >
              <Code className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </Tooltip>
        )}

        {variant === 'full' && (
          <Tooltip content={t.quote || '인용'} position={tooltipPosition}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('blockquote') ? 'bg-gray-300 dark:bg-gray-600' : ''
              }`}
            >
              <Quote className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </Tooltip>
        )}

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <Tooltip content={isUploading ? '업로드 중...' : (t.addImage || '이미지 추가')} position={tooltipPosition}>
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={isUploading}
            className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </Tooltip>

        {variant === 'full' && (
          <Tooltip content={t.addLink || '링크 추가'} position={tooltipPosition}>
            <button
              type="button"
              onClick={handleLinkButtonClick}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('link') ? 'bg-gray-300 dark:bg-gray-600' : ''
              }`}
            >
              <Link2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </Tooltip>
        )}

        {variant === 'full' && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

            <Tooltip content={t.undo || '실행 취소'} position={tooltipPosition}>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </Tooltip>

            <Tooltip content={t.redo || '다시 실행'} position={tooltipPosition}>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Link Input Modal */}
      {showLinkInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              링크 추가
            </h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSetLink();
                }
                if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                취소
              </button>
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  링크 제거
                </button>
              )}
              <button
                type="button"
                onClick={handleSetLink}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {editor.isActive('link') ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
