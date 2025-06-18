const { messageService, fileParseService } = window.service;

export async function parseAndUpdateAttachments(
  userMessageId: string,
): Promise<void> {
  try {
    // Get the user message
    const userMessage = await messageService.getMessageById(userMessageId);

    if (!userMessage || !userMessage.attachments) {
      return;
    }

    // Parse attachments JSON
    let attachments: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      preview?: string;
      fileData?: string;
      fileContent?: string;
    }> = [];

    try {
      attachments = JSON.parse(userMessage.attachments);
    } catch (error) {
      console.error("Failed to parse attachments JSON:", error);
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
    let hasUpdates = false;
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

          attachment.fileContent = fileContent;
          hasUpdates = true;
        } catch (error) {
          // Continue with other attachments
          console.error("Failed to parse file content:", error);
        }
      }
    }

    // Update the message with parsed content if there were updates
    if (hasUpdates) {
      await messageService.updateMessage(userMessageId, {
        attachments: JSON.stringify(attachments),
      });
    }
  } catch (error) {
    console.error("Failed to parse and update attachments:", error);
  }
}
