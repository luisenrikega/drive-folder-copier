class DriveService {
  constructor() {
    this.token = null;
  }

  async getAuthToken(interactive = true) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.token = token;
          resolve(token);
        }
      });
    });
  }

  async fetch(url, options = {}, _isRetry = false) {
    if (!this.token) await this.getAuthToken();
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 && !_isRetry) {
      // Token expired — remove cached token, get a new one, and retry once
      await new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken({ token: this.token }, resolve);
      });
      this.token = null;
      await this.getAuthToken(false);
      return this.fetch(url, options, true);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: t('driveApiError') } }));
      throw new Error((error.error && error.error.message) || t('driveApiError'));
    }

    return response.json();
  }

  async getFileMetadata(fileId) {
    return this.fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,parents&supportsAllDrives=true`);
  }

  async createFolder(name, parents = []) {
    const body = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parents
    };
    return this.fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async copyFile(fileId, name, parents = []) {
    const body = {
      name: name,
      parents: parents
    };
    return this.fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy?supportsAllDrives=true`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async listFolderContents(folderId) {
    const q = `'${folderId}' in parents and trashed = false`;
    const fields = 'nextPageToken, files(id, name, mimeType)';
    let allFiles = [];
    let pageToken = null;

    do {
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }
      const result = await this.fetch(url);
      allFiles = allFiles.concat(result.files || []);
      pageToken = result.nextPageToken || null;
    } while (pageToken);

    return { files: allFiles };
  }
}

// Export for both window and service worker
if (typeof window !== 'undefined') {
  window.driveService = new DriveService();
} else {
  self.driveService = new DriveService();
}
