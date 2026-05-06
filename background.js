importScripts('i18n.js', 'driveService.js');

let copyState = {
  isCopying: false,
  progress: 0,
  message: '',
  folderId: null,
  stats: {
    total: 0,
    current: 0
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCopy') {
    if (copyState.isCopying) {
      sendResponse({ status: 'already_running' });
      return;
    }
    startCopyProcess(request.folderId);
    sendResponse({ status: 'started' });
  } else if (request.action === 'getStatus') {
    sendResponse(copyState);
  } else if (request.action === 'resetStatus') {
    copyState = {
      isCopying: false,
      progress: 0,
      message: '',
      folderId: null,
      stats: { total: 0, current: 0 }
    };
    sendResponse({ status: 'reset' });
  }
  return true;
});

async function startCopyProcess(folderId) {
  copyState.isCopying = true;
  copyState.progress = 0;
  copyState.message = t('verifyingSession');
  copyState.folderId = folderId;
  copyState.stats = { total: 0, current: 0 };
  updateUI();

  try {
    await driveService.getAuthToken(false);
    
    copyState.message = t('analyzingFolder');
    updateUI();
    const rootMeta = await driveService.getFileMetadata(folderId);
    
    if (rootMeta.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error(t('notAFolder'));
    }
    
    // Preliminary count
    await countItems(folderId);
    
    // Determine target parent: try source parent, fall back to root
    let targetParentId = 'root';
    if (rootMeta.parents && rootMeta.parents.length > 0) {
      targetParentId = rootMeta.parents[0];
    }

    copyState.message = t('creatingRoot');
    updateUI();

    let newRoot;
    try {
      newRoot = await driveService.createFolder(`${rootMeta.name} copy`, [targetParentId]);
    } catch (e) {
      // If we can't write to the source parent, fall back to root
      console.warn('Cannot write to source parent, using root instead', e);
      newRoot = await driveService.createFolder(`${rootMeta.name} copy`, ['root']);
    }

    copyState.message = t('copyingContent');
    updateUI();
    await copyRecursive(folderId, newRoot.id);

    copyState.message = t('completedSuccess');
    copyState.progress = 100;
    showNotification(t('copyFinished'), t('folderCreated', { name: `${rootMeta.name} copy` }));
  } catch (error) {
    console.error('Fatal Copy Error:', error);
    copyState.message = t('criticalError', { message: error.message });
    copyState.progress = 0;
    showNotification(t('copyError'), error.message);
  } finally {
    copyState.isCopying = false;
    updateUI();
  }
}

async function countItems(sourceId) {
  try {
    const contents = await driveService.listFolderContents(sourceId);
    copyState.stats.total += contents.files.length;
    for (const item of contents.files) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        await countItems(item.id);
      }
    }
  } catch (e) {
    console.error('Error counting items:', e);
  }
}

async function copyRecursive(sourceId, destId) {
  const contents = await driveService.listFolderContents(sourceId);
  
  for (const item of contents.files) {
    copyState.stats.current++;
    if (copyState.stats.total > 0) {
      copyState.progress = (copyState.stats.current / copyState.stats.total) * 100;
    }
    
    copyState.message = t('copyingProgress', {
      current: copyState.stats.current,
      total: copyState.stats.total,
      name: item.name
    });
    updateUI();

    try {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        const newFolder = await driveService.createFolder(item.name, [destId]);
        await copyRecursive(item.id, newFolder.id);
      } else {
        await driveService.copyFile(item.id, item.name, [destId]);
      }
    } catch (e) {
      console.error(`Error copying item ${item.name}:`, e);
      // Continue with next items
    }
  }
}

function updateUI() {
  chrome.runtime.sendMessage({ action: 'progressUpdate', ...copyState }).catch(() => {
    // Ignore error if popup is closed
  });
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 2
  });
}
