; Custom uninstaller script for 302 AI Studio
; Provides user option to delete application data during uninstallation

!macro customUnInstallCheck
  ; Define variables using register variables
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" "AppData"
  StrCpy $1 "$0\302AIStudio"        ; $1 = APPDATA_DIR
  StrCpy $2 "$LOCALAPPDATA\302AIStudio"  ; $2 = USERDATA_DIR
  
  ; Check if user data exists
  ${If} ${FileExists} "$1\*.*"
    Goto DataExists
  ${EndIf}
  ${If} ${FileExists} "$2\*.*"
    Goto DataExists
  ${EndIf}
  Goto NoData

  DataExists:
    ; Show custom dialog asking about user data deletion
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION "302 AI Studio Uninstaller$\n$\nDo you want to remove all application data?$\n$\nThis includes:$\n• Chat conversations and threads$\n• Uploaded files and attachments$\n• Application settings and preferences$\n• Cached data and logs$\n$\nChoose 'Yes' to remove all data$\nChoose 'No' to keep your data$\nChoose 'Cancel' to abort uninstallation" /SD IDNO IDYES RemoveData IDNO KeepData IDCANCEL AbortUninstall
    
    RemoveData:
      DetailPrint "Removing application data..."
      
      ; Remove Triplit database files
      Delete "$2\triplit\db.sqlite"
      Delete "$2\triplit\db.sqlite-wal"
      Delete "$2\triplit\db.sqlite-shm"
      RMDir /r "$2\triplit"
      
      ; Remove temporary files
      RMDir /r "$2\temp"
      
      ; Remove log files
      Delete "$2\logs\main.log"
      Delete "$2\logs\*.log"
      RMDir "$2\logs"
      
      ; Remove cache and other data
      RMDir /r "$2\Cache"
      RMDir /r "$2\CachedData"
      RMDir /r "$2\Code Cache"
      RMDir /r "$2\DawnCache"
      RMDir /r "$2\GPUCache"
      RMDir /r "$2\Local Storage"
      RMDir /r "$2\Session Storage"
      RMDir /r "$2\IndexedDB"
      
      ; Remove configuration files
      Delete "$2\Preferences"
      Delete "$2\config.json"
      Delete "$2\storage.json"
      
      ; Remove the main user data directory if empty
      RMDir "$2"
      
      ; Remove AppData directory if it exists
      RMDir /r "$1"
      
      DetailPrint "Application data removed successfully."
      Goto Continue
    
    KeepData:
      DetailPrint "Application data will be preserved."
      MessageBox MB_OK|MB_ICONINFORMATION "Your application data has been preserved.$\n$\nData location: $2$\n$\nYou can manually delete this folder later if needed."
      Goto Continue
    
    AbortUninstall:
      DetailPrint "Uninstallation cancelled by user."
      Abort "Uninstallation cancelled by user."
    
  NoData:
    DetailPrint "No application data found to remove."
    
  Continue:
!macroend

!macro customUninstallPage
  ; Custom uninstaller page (if needed for future enhancements)
!macroend

; Additional cleanup for Windows integration
!macro customRemoveFiles
  ; Remove any additional program files
  Delete "$INSTDIR\resources\app.asar.unpacked\node_modules\sharp\*.*"
  Delete "$INSTDIR\resources\app.asar.unpacked\node_modules\@img\*.*"
  
  ; Remove temporary installation files
  Delete "$TEMP\302AIStudio-*.tmp"
  Delete "$TEMP\electron-updater-*.tmp"
  
  ; Clean up registry entries (if any were created)
  DeleteRegKey HKCU "Software\302AIStudio"
  DeleteRegKey HKLM "Software\WOW6432Node\302AIStudio"
  
  ; Remove from Windows Defender exclusions (if added)
  ; This is handled by Windows automatically when the program is uninstalled
!macroend