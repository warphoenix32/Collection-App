(() => {
  const DCE = globalThis.DCE;

  function participantKey(author) {
    return DCE.identity.observationKey(author);
  }

  function buildParticipants(rawMessages) {
    return DCE.identity.build(rawMessages);
  }

  function normalizeMessage(raw, participants) {
    const participant = DCE.identity.resolve(participants, raw.author);
    return {
      messageId: raw.messageId,
      participantId: participant?.participantId || null,
      timestamp: raw.timestamp,
      content: {
        text: raw.content || "",
        format: "plain",
        kind: raw.contentKind || (raw.content ? "text" : (raw.attachments?.length ? "attachment-only" : "empty"))
      },
      reply: raw.replyTo ? {
        messageId: raw.replyMessageId || null,
        participantId: null,
        preview: raw.replyTo,
        resolved: Boolean(raw.replyMessageId)
      } : null,
      mentions: (raw.mentions || []).map(item => ({
        participantId: item.userId ? `discord-user-${item.userId}` : null,
        platformUserId: item.userId || null,
        displayText: item.originalText
      })),
      attachments: raw.attachments || [],
      flags: {
        edited: Boolean(raw.edited),
        deletedReference: Boolean(raw.deletedReference),
        authorInferred: Boolean(raw.author?.inferred)
      },
      provenance: {
        adapter: "discord",
        sourceElementId: raw.sourceElementId || null
      }
    };
  }

  function buildConversation({ rawMessages, source, options, collectionReport, startedAt, finishedAt }) {
    const participantsMap = buildParticipants(rawMessages);
    const messages = rawMessages.map(message => normalizeMessage(message, participantsMap));
    const byId = new Map(messages.map(message => [message.messageId, message]));
    const priorByPreview = new Map();
    for (const message of messages) {
      if (message.reply) {
        let target = message.reply.messageId ? byId.get(message.reply.messageId) : null;
        if (!target && message.reply.preview) target = priorByPreview.get(message.reply.preview.replace(/\s+/g, " ").trim()) || null;
        if (target) {
          message.reply.messageId = target.messageId;
          message.reply.participantId = target.participantId;
          message.reply.resolved = true;
        }
      }
      const key = message.content.text.replace(/\s+/g, " ").trim();
      if (key) priorByPreview.set(key, message);
    }
    const timestamps = messages.map(message => Date.parse(message.timestamp)).filter(Number.isFinite);
    const warnings = [...(collectionReport?.warnings || [])];
    const missingIdentity = messages.filter(message => !message.participantId).length;
    const inferredIdentity = messages.filter(message => message.flags.authorInferred).length;
    if (missingIdentity) warnings.push(`${missingIdentity} messages have no resolved participant.`);

    return {
      metadata: {
        schemaName: "collection-platform-conversation",
        schemaVersion: DCE.config.schemaVersion,
        exportId: crypto.randomUUID ? crypto.randomUUID() : `export-${Date.now()}`,
        exportedAt: new Date(finishedAt).toISOString(),
        collectorVersion: DCE.config.extensionVersion,
        adapterVersion: DCE.config.adapterVersion
      },
      source: {
        platform: "discord",
        conversationType: source.type,
        acquisitionStrategy: source.acquisitionStrategy,
        url: source.url,
        workspace: source.workspace,
        conversation: source.conversation,
        platformMetadata: source.platformMetadata || {}
      },
      collection: {
        requestedRange: { start: options.startIso || null, end: options.endIso || null },
        actualRange: {
          start: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
          end: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null
        },
        complete: collectionReport?.complete ?? true,
        durationMs: finishedAt - startedAt,
        messageCount: messages.length,
        participantCount: participantsMap.size,
        identityEngineVersion: DCE.config.identityEngineVersion,
        loadOlder: collectionReport || null,
        coverage: collectionReport?.coverage || { status: "not-requested", startReached: true, confidence: "high" }
      },
      participants: Array.from(participantsMap.values()),
      messages,
      diagnostics: {
        warnings,
        missingIdentityCount: missingIdentity,
        inferredIdentityCount: inferredIdentity,
        messagesSkipped: collectionReport?.messagesSkipped || 0,
        selectorFallbacksUsed: collectionReport?.selectorFallbacksUsed || 0,
        excludedMedia: DCE.config.excludedMedia
      },
      provenance: {
        generatedBy: "Collection Platform Discord Adapter",
        normalizedFrom: "live-discord-dom"
      }
    };
  }

  DCE.conversationModel = { buildConversation };
})();
