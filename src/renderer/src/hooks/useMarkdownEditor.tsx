import { MDXEditorMethods } from '@mdxeditor/editor'
import { saveNoteAtom, selectedNoteAtom } from '@renderer/store'
import { useAtomValue, useSetAtom } from 'jotai'
import { useRef } from 'react'
import { NoteContent } from '@shared/models'
import { throttle } from 'lodash'
import { autoSaveIntervalMs } from '@shared/contants'

export const useMarkdownEditor = () => {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const saveNote = useSetAtom(saveNoteAtom)
  const editorRef = useRef<MDXEditorMethods>(null)

  const handleAutoSaving = throttle(
    async (content: NoteContent) => {
      if (!selectedNote) return

      console.log('Auto saving note...', selectedNote.title)

      await saveNote(content)
    },
    autoSaveIntervalMs,
    { leading: false, trailing: true }
  )

  const handleBlur = async () => {
    if (!selectedNote) return

    console.log('Saving on blur...', selectedNote.title)

    handleAutoSaving.cancel()

    const content = editorRef.current?.getMarkdown()

    if (content != null) {
      await saveNote(content)
    }
  }

  return {
    editorRef,
    selectedNote,
    handleAutoSaving,
    handleBlur,
  }
}
