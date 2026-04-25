"use client";

import { useState, type ChangeEvent } from "react";
import { useNotesStoreSelectors } from "@/store/useNotesStore";
import { useSettingsStoreSelectors } from "@/store/useSettingsStore";
import type { NotesProps, ViewMode } from "@/types/apps/notes";

export const useNotesController = ({ isDarkMode = true }: NotesProps) => {
  const notes = useNotesStoreSelectors.use.notes();
  const selectedNoteId = useNotesStoreSelectors.use.selectedNoteId();
  const selectNote = useNotesStoreSelectors.use.selectNote();
  const updateSelectedNoteContent =
    useNotesStoreSelectors.use.updateSelectedNoteContent();

  const reduceMotion = useSettingsStoreSelectors.use.reduceMotion();
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateSelectedNoteContent(event.target.value);
  };

  return {
    notes,
    selectedNote,
    selectedNoteId,
    selectNote,
    reduceMotion,
    viewMode,
    setViewMode,
    handleContentChange,
    textColor: isDarkMode ? "text-white" : "text-gray-800",
    bgColor: isDarkMode ? "bg-gray-900" : "bg-white",
    sidebarBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    borderColor: isDarkMode ? "border-gray-700" : "border-gray-200",
    hoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200",
    selectedBg: isDarkMode ? "bg-gray-700" : "bg-gray-300",
    toggleBg: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    toggleHoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200",
    toggleText: isDarkMode ? "text-gray-200" : "text-gray-700",
    previewTextColor: isDarkMode ? "text-gray-400" : "text-gray-600",
  };
};
