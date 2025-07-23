; Custom uninstaller script for 302 AI Studio
; Provides user option to delete application data during uninstallation

!macro customUnInstallCheck
  ; Define variables for user data paths
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders" "AppData"
  StrCpy $APPDATA_DIR "$0\302AIStudio"
  StrCpy $USERDATA_DIR "$LOCALAPPDATA\302AIStudio"
  
  ; Check if user data exists
  ${If} ${FileExists} "$APPDATA_DIR\*.*"
    Goto DataExists
  ${EndIf}
  ${If} ${FileExists} "$USERDATA_DIR\*.*"
    Goto DataExists
  ${EndIf}
  Goto NoData

  DataExists:
    ; Show custom dialog asking about user data deletion
    MessageBox MB_YESNOCANCEL|MB_ICONQUESTION \
      "302 AI Studio Uninstaller$\n$\nDo you want to remove all application data?$\n$\nThis includes:$\n• Chat conversations and threads$\n• Uploaded files and attachments$\n• Application settings and preferences$\n• Cached data and logs$\n$\nChoose 'Yes' to remove all data$\nChoose 'No' to keep your data$\nChoose 'Cancel' to abort uninstallation" \
      /SD IDNO \
      IDYES RemoveData \
      IDNO KeepData \
      IDCANCEL AbortUninstall
    
    RemoveData:
      DetailPrint "Removing application data..."
      
      ; Remove Triplit database files
      Delete "$USERDATA_DIR\triplit\db.sqlite"
      Delete "$USERDATA_DIR\triplit\db.sqlite-wal"
      Delete "$USERDATA_DIR\triplit\db.sqlite-shm"
      RMDir /r "$USERDATA_DIR\triplit"
      
      ; Remove temporary files
      RMDir /r "$USERDATA_DIR\temp"
      
      ; Remove log files
      Delete "$USERDATA_DIR\logs\main.log"
      Delete "$USERDATA_DIR\logs\*.log"
      RMDir "$USERDATA_DIR\logs"
      
      ; Remove cache and other data
      RMDir /r "$USERDATA_DIR\Cache"
      RMDir /r "$USERDATA_DIR\CachedData"
      RMDir /r "$USERDATA_DIR\Code Cache"
      RMDir /r "$USERDATA_DIR\DawnCache"
      RMDir /r "$USERDATA_DIR\GPUCache"
      RMDir /r "$USERDATA_DIR\Local Storage"
      RMDir /r "$USERDATA_DIR\Session Storage"
      RMDir /r "$USERDATA_DIR\IndexedDB"
      
      ; Remove configuration files
      Delete "$USERDATA_DIR\Preferences"
      Delete "$USERDATA_DIR\config.json"
      Delete "$USERDATA_DIR\storage.json"
      
      ; Remove the main user data directory if empty
      RMDir "$USERDATA_DIR"
      
      ; Remove AppData directory if it exists
      RMDir /r "$APPDATA_DIR"
      
      DetailPrint "Application data removed successfully."
      Goto Continue
    
    KeepData:
      DetailPrint "Application data will be preserved."
      MessageBox MB_OK|MB_ICONINFORMATION \
        "Your application data has been preserved.$\n$\nData location: $USERDATA_DIR$\n$\nYou can manually delete this folder later if needed."
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

; Uninstaller language strings
LangString UninstallDataPrompt ${LANG_ENGLISH} "Do you want to remove all application data including your conversations, settings, and uploaded files?"
LangString UninstallDataYes ${LANG_ENGLISH} "Yes, remove all data"
LangString UninstallDataNo ${LANG_ENGLISH} "No, keep my data"
LangString UninstallDataCancel ${LANG_ENGLISH} "Cancel uninstallation"
LangString UninstallDataRemoved ${LANG_ENGLISH} "Application data has been removed."
LangString UninstallDataKept ${LANG_ENGLISH} "Application data has been preserved."

; Chinese language support
LangString UninstallDataPrompt ${LANG_SIMPCHINESE} "是否要删除所有应用数据，包括您的对话、设置和上传的文件？"
LangString UninstallDataYes ${LANG_SIMPCHINESE} "是，删除所有数据"
LangString UninstallDataNo ${LANG_SIMPCHINESE} "否，保留我的数据"
LangString UninstallDataCancel ${LANG_SIMPCHINESE} "取消卸载"
LangString UninstallDataRemoved ${LANG_SIMPCHINESE} "应用数据已删除。"
LangString UninstallDataKept ${LANG_SIMPCHINESE} "应用数据已保留。"

; Japanese language support  
LangString UninstallDataPrompt ${LANG_JAPANESE} "会話、設定、アップロードしたファイルを含む、すべてのアプリケーションデータを削除しますか？"
LangString UninstallDataYes ${LANG_JAPANESE} "はい、すべてのデータを削除"
LangString UninstallDataNo ${LANG_JAPANESE} "いいえ、データを保持"
LangString UninstallDataCancel ${LANG_JAPANESE} "アンインストールをキャンセル"
LangString UninstallDataRemoved ${LANG_JAPANESE} "アプリケーションデータが削除されました。"
LangString UninstallDataKept ${LANG_JAPANESE} "アプリケーションデータが保持されました。"