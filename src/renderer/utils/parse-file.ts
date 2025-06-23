const { fileParseService, attachmentService } = window.service;

export async function parseAndUpdateAttachments(
  userMessageId: string,
): Promise<void> {
  try {
    // Get attachments from database
    const attachments =
      await attachmentService.getAttachmentsByMessageId(userMessageId);

    if (!attachments || attachments.length === 0) {
      return;
    }

    // Check if any attachments need parsing
    const needsParsing = await Promise.all(
      attachments.map(
        async (att) =>
          !att.fileContent &&
          att.fileData &&
          (await fileParseService.shouldParseFile(att.type)),
      ),
    ).then((results) => results.some(Boolean));

    if (!needsParsing) {
      return;
    }

    // Parse each attachment that needs parsing
    for (const attachment of attachments) {
      if (
        !attachment.fileContent &&
        attachment.fileData &&
        (await fileParseService.shouldParseFile(attachment.type))
      ) {
        try {
          const fileContent = await fileParseService.parseFileContent({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            fileData: attachment.fileData,
          });

          // Update the attachment with parsed content
          await attachmentService.updateAttachment(attachment.id, {
            fileContent: fileContent,
          });
        } catch (error) {
          // Continue with other attachments
          console.error("Failed to parse file content:", error);
        }
      }
    }
  } catch (error) {
    console.error("Failed to parse and update attachments:", error);
  }
}
