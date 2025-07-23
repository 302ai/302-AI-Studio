; Custom uninstaller script for 302 AI Studio
; Provides user option to delete application data during uninstallation

!macro customUnInstallCheck
  ; Ask user about data deletion with simple MessageBox
  MessageBox MB_YESNO "Do you want to remove all application data (conversations, settings, files)?" IDYES RemoveAllData
  
  ; User chose NO - preserve data
  DetailPrint "Application data will be preserved."
  Goto Continue
  
  RemoveAllData:
    DetailPrint "Removing application data..."
    
    ; Remove user data directory
    RMDir /r "$LOCALAPPDATA\302AIStudio"
    
    ; Remove AppData directory if it exists
    ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" "AppData"
    RMDir /r "$0\302AIStudio"
    
    DetailPrint "Application data removed successfully."
    
  Continue:
!macroend

!macro customUninstallPage
  ; Custom uninstaller page (if needed for future enhancements)
!macroend

!macro customRemoveFiles
  ; Remove temporary installation files
  Delete "$TEMP\302AIStudio-*.tmp"
  Delete "$TEMP\electron-updater-*.tmp"
  
  ; Clean up registry entries
  DeleteRegKey HKCU "Software\302AIStudio"
  DeleteRegKey HKLM "Software\WOW6432Node\302AIStudio"
!macroend