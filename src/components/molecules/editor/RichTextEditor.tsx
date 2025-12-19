'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Heading1, Heading2, Code, ImageIcon, Link2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Tooltip from '@/components/atoms/Tooltip';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/providers/LoginPromptProvider';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-thumbnail': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-thumbnail'),
        renderHTML: (attributes) =>
          attributes['data-thumbnail'] ? { 'data-thumbnail': 'true' } : {},
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  translations: any;
  variant?: 'full' | 'basic';
  tooltipPosition?: 'top' | 'below' | 'right' | 'bottom-right';
  onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
  locale?: 'ko' | 'en' | 'vi';
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  translations,
  variant = 'full',
  tooltipPosition = 'below',
  onFocus,
  locale = 'ko',
}: RichTextEditorProps) {
  const t = translations?.tooltips || {};
  const tEditor = translations?.editor || {};
  const tCommon = translations?.common || {};
  const editorCopy = useMemo(() => {
    const isVi = locale === 'vi';
    const isEn = locale === 'en';
    return {
      imageTypeError: tEditor.imageTypeError || (isVi ? 'Chỉ cho phép tệp ảnh.' : isEn ? 'Only image files are allowed.' : '이미지 파일만 업로드할 수 있습니다.'),
      imageSizeError: tEditor.imageSizeError || (isVi ? 'Kích thước ảnh phải ≤ 5MB.' : isEn ? 'Image size must be 5MB or less.' : '이미지 크기는 5MB 이하여야 합니다.'),
      imageUploadFailed: tEditor.imageUploadFailed || (isVi ? 'Tải ảnh thất bại.' : isEn ? 'Failed to upload image.' : '이미지 업로드에 실패했습니다.'),
      imageUploadError: tEditor.imageUploadError || (isVi ? 'Đã xảy ra lỗi khi tải ảnh.' : isEn ? 'An error occurred while uploading the image.' : '이미지 업로드 중 오류가 발생했습니다.'),
      linkTitle: tEditor.linkTitle || (isVi ? 'Thêm liên kết' : isEn ? 'Add link' : '링크 추가'),
      linkPlaceholder: tEditor.linkPlaceholder || 'https://example.com',
      linkCancel: tEditor.linkCancel || tCommon.cancel || (isVi ? 'Huỷ' : isEn ? 'Cancel' : '취소'),
      linkRemove: tEditor.linkRemove || (isVi ? 'Xoá liên kết' : isEn ? 'Remove link' : '링크 제거'),
      linkUpdate: tEditor.linkUpdate || (isVi ? 'Cập nhật' : isEn ? 'Update' : '수정'),
      linkAdd: tEditor.linkAdd || (isVi ? 'Thêm' : isEn ? 'Add' : '추가'),
    };
  }, [locale, tCommon, tEditor]);
  const fallbackTooltips = {
    bold: locale === 'vi' ? 'Đậm' : locale === 'en' ? 'Bold' : '굵게',
    italic: locale === 'vi' ? 'Nghiêng' : locale === 'en' ? 'Italic' : '기울임',
    heading1: locale === 'vi' ? 'Tiêu đề 1' : locale === 'en' ? 'Heading 1' : '제목1',
    heading2: locale === 'vi' ? 'Tiêu đề 2' : locale === 'en' ? 'Heading 2' : '제목2',
    bulletList: locale === 'vi' ? 'Danh sách' : locale === 'en' ? 'Bullet list' : '목록',
    orderedList: locale === 'vi' ? 'Danh sách số' : locale === 'en' ? 'Numbered list' : '번호 목록',
    codeBlock: locale === 'vi' ? 'Khối mã' : locale === 'en' ? 'Code block' : '코드 블록',
    quote: locale === 'vi' ? 'Trích dẫn' : locale === 'en' ? 'Quote' : '인용',
    addImage: locale === 'vi' ? 'Thêm ảnh' : locale === 'en' ? 'Add image' : '이미지 추가',
    addLink: locale === 'vi' ? 'Thêm liên kết' : locale === 'en' ? 'Add link' : '링크 추가',
    uploading: locale === 'vi' ? 'Đang tải...' : locale === 'en' ? 'Uploading...' : '업로드 중...',
    undo: locale === 'vi' ? 'Hoàn tác' : locale === 'en' ? 'Undo' : '실행 취소',
    redo: locale === 'vi' ? 'Làm lại' : locale === 'en' ? 'Redo' : '다시 실행',
  };
  const boldLabel = t.bold || fallbackTooltips.bold;
  const italicLabel = t.italic || fallbackTooltips.italic;
  const heading1Label = t.heading1 || fallbackTooltips.heading1;
  const heading2Label = t.heading2 || fallbackTooltips.heading2;
  const bulletListLabel = t.bulletList || fallbackTooltips.bulletList;
  const orderedListLabel = t.orderedList || fallbackTooltips.orderedList;
  const codeBlockLabel = t.codeBlock || fallbackTooltips.codeBlock;
  const quoteLabel = t.quote || fallbackTooltips.quote;
  const addImageLabel = t.addImage || fallbackTooltips.addImage;
  const addLinkLabel = t.addLink || fallbackTooltips.addLink;
  const uploadingLabel = fallbackTooltips.uploading;
  const undoLabel = t.undo || fallbackTooltips.undo;
  const redoLabel = t.redo || fallbackTooltips.redo;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { openLoginPrompt } = useLoginPrompt();
  const { data: session } = useSession();

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage.configure({
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
    if (!session?.user) {
      openLoginPrompt();
      return;
    }
    fileInputRef.current?.click();
  }, [openLoginPrompt, session?.user]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(editorCopy.imageTypeError);
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(editorCopy.imageSizeError);
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
        toast.error(result.error || editorCopy.imageUploadFailed);
        return;
      }

      editor.chain().focus().setImage({ src: result.data.url }).run();
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(editorCopy.imageUploadError);
    } finally {
      setIsUploading(false);
    }

    // Reset input
    event.target.value = '';
  }, [editor, editorCopy, openLoginPrompt]);

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
        <Tooltip content={boldLabel} position={tooltipPosition}>
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
          <Tooltip content={italicLabel} position={tooltipPosition}>
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
            <Tooltip content={heading1Label} position={tooltipPosition}>
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

            <Tooltip content={heading2Label} position={tooltipPosition}>
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

        <Tooltip content={bulletListLabel} position={tooltipPosition}>
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
          <Tooltip content={orderedListLabel} position={tooltipPosition}>
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
          <Tooltip content={codeBlockLabel} position={tooltipPosition}>
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
          <Tooltip content={quoteLabel} position={tooltipPosition}>
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

        <Tooltip content={isUploading ? uploadingLabel : addImageLabel} position={tooltipPosition}>
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
          <Tooltip content={addLinkLabel} position={tooltipPosition}>
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

            <Tooltip content={undoLabel} position={tooltipPosition}>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </Tooltip>

            <Tooltip content={redoLabel} position={tooltipPosition}>
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
      <EditorContent editor={editor} onFocus={onFocus} />

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
              {editorCopy.linkTitle}
            </h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={editorCopy.linkPlaceholder}
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
                {editorCopy.linkCancel}
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
                  {editorCopy.linkRemove}
                </button>
              )}
              <button
                type="button"
                onClick={handleSetLink}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {editor.isActive('link') ? editorCopy.linkUpdate : editorCopy.linkAdd}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
