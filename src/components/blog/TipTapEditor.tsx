'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  Palette,
  ChevronDown,
  X,
  Check,
  Code,
  Sparkles,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  isAr?: boolean;
}

// Nuancier professionnel inspiré de Rahalat Bladna & Web
const COLOR_PALETTE = [
  { name: 'Noir profond', color: '#0F172A' },
  { name: 'Ardoise foncée', color: '#334155' },
  { name: 'Bleu nuit Rahalat', color: '#0B2239' },
  { name: 'Cyan Bladna', color: '#1BBACA' },
  { name: 'Terracotta Maroc', color: '#D9784B' },
  { name: 'Vert Forêt Atlas', color: '#0B5C3E' },
  { name: 'Émeraude', color: '#059669' },
  { name: 'Or Impérial', color: '#D97706' },
  { name: 'Rouge Grenade', color: '#DC2626' },
  { name: 'Pourpre Médina', color: '#7C3AED' },
  { name: 'Gris Muted', color: '#64748B' },
];

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Rédigez votre article ici...',
  minHeight = '380px',
  isAr = false,
}: TipTapEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const colorPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto mx-auto shadow-md my-4 border border-slate-200 dark:border-white/10',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-2xl overflow-hidden aspect-video mx-auto my-6 shadow-xl border border-slate-200 dark:border-white/10 max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-tp-cyan hover:underline font-semibold cursor-pointer',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `focus:outline-none min-h-[${minHeight}] px-5 py-4 text-slate-800 dark:text-slate-100 text-sm leading-relaxed prose prose-sm sm:prose-base dark:prose-invert max-w-none`,
        dir: isAr ? 'rtl' : 'ltr',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Mettre à jour le contenu externe si nécessaire
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Fermer le nuancier au clic extérieur
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!editor) {
    return (
      <div className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 min-h-[300px] flex items-center justify-center text-xs text-slate-400">
        Chargement de l’éditeur TipTap...
      </div>
    );
  }

  // Insertion d'image
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl.trim(), alt: imageAlt.trim() || 'Photo article' }).run();
      setImageUrl('');
      setImageAlt('');
      setShowImageModal(false);
    }
  };

  // Insertion de vidéo YouTube
  const handleInsertYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl.trim(),
      });
      setYoutubeUrl('');
      setShowYoutubeModal(false);
    }
  };

  // Insertion de lien
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  const currentColor = editor.getAttributes('textStyle').color || '#0F172A';

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col transition-all focus-within:ring-2 focus-within:ring-cyan-500/20 focus-within:border-cyan-500">
      {/* ======================================================== */}
      {/* BARRE D'OUTILS STYLE WORD / GOOGLE DOCS                 */}
      {/* ======================================================== */}
      <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-1 sm:gap-1.5 select-none text-slate-700 dark:text-slate-300">
        {/* 1. HISTORIQUE UNDO / REDO */}
        <div className="flex items-center gap-0.5 border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* 2. TITRES ET STYLES DE PARAGRAPHE */}
        <div className="flex items-center gap-0.5 border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-2 py-1 text-xs font-semibold rounded-lg transition ${
              editor.isActive('paragraph') && !editor.isActive('heading')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Texte normal"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Titre 1 (H1)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Titre 2 (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Titre 3 (H3)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* 3. FORMATAGE DE CARACTÈRE (GRAS, ITALIQUE, SOULIGNÉ, BARRÉ) */}
        <div className="flex items-center gap-0.5 border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('bold')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('italic')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('underline')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Souligné (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('strike')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Barré"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* 4. NUANCIER DE COULEUR DE POLICE (POPOVER) */}
        <div className="relative border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5" ref={colorPickerRef}>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold transition"
            title="Couleur de police"
          >
            <Palette className="w-3.5 h-3.5" />
            <div
              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-xs"
              style={{ backgroundColor: currentColor }}
            />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full mt-1.5 start-0 z-50 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-52 space-y-2.5">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Couleur de texte
              </span>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTE.map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(item.color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110 relative border border-slate-200 dark:border-white/10 shadow-xs"
                    style={{ backgroundColor: item.color }}
                    title={item.name}
                  >
                    {currentColor === item.color && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white pt-1 border-t border-slate-100 dark:border-white/5 transition"
              >
                Réinitialiser la couleur
              </button>
            </div>
          )}
        </div>

        {/* 5. ALIGNEMENT DU TEXTE */}
        <div className="flex items-center gap-0.5 border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Aligner à gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Centrer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Aligner à droite"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Justifier"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* 6. LISTES ET CITATIONS */}
        <div className="flex items-center gap-0.5 border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('bulletList')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('orderedList')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('blockquote')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Citation"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition"
            title="Ligne horizontale"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* 7. MÉDIAS : IMAGES ET YOUTUBE */}
        <div className="flex items-center gap-1 border-e border-slate-200 dark:border-white/10 pe-1.5 me-0.5">
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition"
            title="Insérer une image par URL"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Image</span>
          </button>

          <button
            type="button"
            onClick={() => setShowYoutubeModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold transition"
            title="Insérer une vidéo YouTube"
          >
            <YoutubeIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkModal(true);
              }
            }}
            className={`p-1.5 rounded-lg transition ${
              editor.isActive('link')
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title={editor.isActive('link') ? 'Retirer le lien' : 'Ajouter un lien'}
          >
            {editor.isActive('link') ? <Unlink className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* 8. EFFACER FORMATAGE */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition ms-auto"
          title="Effacer tout le formatage"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* ZONE DE CONTENU ÉDITABLE                                 */}
      {/* ======================================================== */}
      <div className="flex-1 bg-white dark:bg-slate-900 cursor-text min-h-[320px]">
        <EditorContent editor={editor} />
      </div>

      {/* FOOTER INFORMATIONS (COMPTEUR MOTS) */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
        <span>Éditeur Rich Text Word TipTap</span>
        <span>
          {editor.storage.characterCount?.words?.() ||
            editor.getText().trim().split(/\s+/).filter(Boolean).length}{' '}
          mots
        </span>
      </div>

      {/* ======================================================== */}
      {/* MODAL INSERTION D'IMAGE                                  */}
      {/* ======================================================== */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleInsertImage}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Insérer une Image</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  URL de l’image *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... ou URL Cloudflare"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  Légende / Texte alternatif (Alt)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Paysage des dunes de Merzouga au coucher du soleil"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {imageUrl && (
                <div className="p-2 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50 dark:bg-white/5">
                  <p className="text-[10px] text-slate-400 font-bold mb-1">Aperçu :</p>
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="max-h-36 rounded-lg mx-auto object-cover"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/25 transition active:scale-95"
              >
                Insérer l’image
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL INSERTION YOUTUBE                                  */}
      {/* ======================================================== */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleInsertYoutube}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <YoutubeIcon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Insérer une Vidéo YouTube</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowYoutubeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Lien de la vidéo YouTube *
              </label>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                La vidéo sera intégrée dans un lecteur responsive haute définition dans l’article.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowYoutubeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/25 transition active:scale-95"
              >
                Intégrer la vidéo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL INSERTION DE LIEN                                  */}
      {/* ======================================================== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleInsertLink}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Insérer un lien hypertexte</h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Adresse URL cible *
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/25 transition active:scale-95"
              >
                Appliquer le lien
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
