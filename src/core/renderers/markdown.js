(() => {
  const DCE = globalThis.DCE;
  DCE.renderers = DCE.renderers || {};

  function localTime(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString() : value || "Unknown time";
  }

  function render(model) {
    const participantById = new Map(model.participants.map(p => [p.participantId, p]));
    const sourceName = model.source.conversation?.name || "Current conversation";
    const workspaceName = model.source.workspace?.name || null;
    const lines = [
      "# Conversation Export",
      "",
      `Platform: ${model.source.platform}`,
      workspaceName ? `Workspace: ${workspaceName}` : null,
      `Conversation: ${sourceName}`,
      `Type: ${model.source.conversationType}`,
      `Acquired by: ${model.source.acquisitionStrategy}`,
      `Exported: ${localTime(model.metadata.exportedAt)}`,
      `Messages: ${model.collection.messageCount}`,
      `Collection complete: ${model.collection.complete ? "yes" : "no"}`,
      "",
      "## Participants",
      ""
    ].filter(line => line !== null);

    if (model.participants.length) {
      model.participants.forEach(p => lines.push(`- ${p.displayName || p.platformUserId || p.participantId}`));
    } else {
      lines.push("- No participants identified");
    }

    if (model.diagnostics.warnings.length) {
      lines.push("", "## Collection Warnings", "");
      model.diagnostics.warnings.forEach(warning => lines.push(`- ${warning}`));
    }

    lines.push("", "---", "");
    for (const message of model.messages) {
      const participant = participantById.get(message.participantId);
      const author = participant?.displayName || participant?.platformUserId || "Unknown author";
      lines.push(`### ${author}`, localTime(message.timestamp));
      if (message.flags.edited) lines.push("_Edited_");
      if (message.flags.authorInferred) lines.push("_Author inferred from message grouping_");
      if (message.reply) lines.push(`_Reply context:_ ${message.reply.preview.replace(/\s+/g, " ").trim()}`);
      lines.push("", message.content.text || "[No text content]");
      if (message.mentions.length) lines.push("", `Mentions: ${message.mentions.map(m => m.displayText).join(", ")}`);
      if (message.attachments.length) {
        lines.push("", "Attachments:");
        for (const attachment of message.attachments) {
          const label = attachment.filename || attachment.type || "attachment";
          lines.push(`- ${label}${attachment.url ? ` — ${attachment.url}` : ""}`);
        }
      }
      lines.push("", "---", "");
    }
    return lines.join("\n");
  }

  DCE.renderers.markdown = render;
})();
