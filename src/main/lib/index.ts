import { homedir } from 'os'
import { appDirectoryName, fileEncoding } from '@shared/contants'
import { ensureDir, readFile, readdir, stat, writeFile, remove } from 'fs-extra'
import { NoteInfo } from '@shared/models'
import { CreateNote, DeleteNote, GetNotes, ReadNote, WriteNote } from '@shared/types'
import { dialog } from 'electron'
import path from 'path'

export const getRootDir = () => {
  return `${homedir()}/${appDirectoryName}`
}

export const getNotes: GetNotes = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const notesFileNames = await readdir(rootDir, {
    encoding: fileEncoding,
    withFileTypes: false,
  })

  const notes = notesFileNames.filter((fileName) => fileName.endsWith('.md'))

  return Promise.all(notes.map(getNoteInfoFromFilename))
}

export const getNoteInfoFromFilename = async (fileName: string): Promise<NoteInfo> => {
  const fileStats = await stat(`${getRootDir()}/${fileName}`)

  return {
    title: fileName.replace('.md', ''),
    lastEditTime: fileStats.mtimeMs,
  }
}

export const readNote: ReadNote = async (filename) => {
  const rootDir = getRootDir()

  return readFile(`${rootDir}/${filename}.md`, { encoding: fileEncoding })
}

export const writeNote: WriteNote = async (filename, content) => {
  const rootDir = getRootDir()

  console.info(`Writing note ${filename}`)
  return writeFile(`${rootDir}/${filename}.md`, content, { encoding: fileEncoding })
}

export const createNote: CreateNote = async () => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'New note',
    defaultPath: `${rootDir}/Untitled.md`,
    buttonLabel: 'Create',
    showsTagField: false,
    filters: [
      {
        name: 'Markdown',
        extensions: ['md'],
      },
    ],
  })

  if (canceled || !filePath) return false

  const { name: filename, dir: parentDir } = path.parse(filePath)

  if (parentDir !== rootDir) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Creation failed',
      message: `All notes must be saved under ${rootDir}`,
    })

    return false
  }

  console.log(`Creating note ${filename}`)
  await writeFile(filePath, '')
  return filename
}

export const deleteNote: DeleteNote = async (filename: string) => {
  const rootDir = getRootDir()

  await ensureDir(rootDir)

  console.info(`Deleting note ${filename}`)

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Delete note',
    message: `Are you sure you want to delete ${filename}?`,
    buttons: ['Delete', 'Cancel'],
  })

  if (response === 1) return false

  await remove(`${rootDir}/${filename}.md`)
  return true
}
