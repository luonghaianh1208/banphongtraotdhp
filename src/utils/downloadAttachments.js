const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*]/g;

const sanitizeName = (value, fallback) => {
  const cleaned = String(value || '')
    .replace(INVALID_FILE_NAME_CHARS, '_')
    .split('')
    .filter(character => character.charCodeAt(0) > 31)
    .join('')
    .replace(/[. ]+$/g, '')
    .trim();
  return cleaned || fallback;
};

const getUniqueName = (usedNames, requestedName) => {
  const normalized = requestedName.toLowerCase();
  if (!usedNames.has(normalized)) {
    usedNames.add(normalized);
    return requestedName;
  }

  const dotIndex = requestedName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? requestedName.slice(0, dotIndex) : requestedName;
  const extension = dotIndex > 0 ? requestedName.slice(dotIndex) : '';
  let index = 2;

  while (usedNames.has(`${baseName} (${index})${extension}`.toLowerCase())) index += 1;
  const uniqueName = `${baseName} (${index})${extension}`;
  usedNames.add(uniqueName.toLowerCase());
  return uniqueName;
};

const triggerBlobDownload = (blob, fileName) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};

const getAttachmentData = async (file) => {
  if (!file?.url) throw new Error('Tài liệu không có đường dẫn tải xuống.');

  if (file.isLink) {
    return {
      data: `[InternetShortcut]\r\nURL=${file.url}\r\n`,
      type: 'application/internet-shortcut',
    };
  }

  const response = await fetch(file.url);
  if (!response.ok) throw new Error(`Không thể tải ${file.name || 'tài liệu'}.`);
  return {
    data: await response.arrayBuffer(),
    type: response.headers.get('content-type') || 'application/octet-stream',
  };
};

const getAttachmentFileName = (file, fallback = 'tai-lieu') => {
  const name = sanitizeName(file?.name, fallback);
  return file?.isLink && !name.toLowerCase().endsWith('.url') ? `${name}.url` : name;
};

export const countAttachments = (items = []) => items.reduce(
  (total, item) => total + (item?.attachments || []).filter(file => file?.url).length,
  0
);

export const downloadAttachment = async (file) => {
  const { data, type } = await getAttachmentData(file);
  const blob = new Blob([data], { type });
  triggerBlobDownload(blob, getAttachmentFileName(file));
};

export const downloadAttachmentGroupsAsZip = async (items, archiveName) => {
  const groups = (items || [])
    .map(item => ({
      title: item?.title,
      attachments: (item?.attachments || []).filter(file => file?.url),
    }))
    .filter(item => item.attachments.length > 0);

  if (!groups.length) throw new Error('Không có tài liệu để tải xuống.');

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const usedFolderNames = new Set();

  await Promise.all(groups.map(async (group, groupIndex) => {
    const folderName = getUniqueName(
      usedFolderNames,
      sanitizeName(group.title, `muc-${groupIndex + 1}`)
    );
    const folder = zip.folder(folderName);
    const usedFileNames = new Set();

    await Promise.all(group.attachments.map(async (file, fileIndex) => {
      const { data } = await getAttachmentData(file);
      const fileName = getUniqueName(
        usedFileNames,
        getAttachmentFileName(file, `tai-lieu-${fileIndex + 1}`)
      );
      folder.file(fileName, data);
    }));
  }));

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  triggerBlobDownload(zipBlob, `${sanitizeName(archiveName, 'tai-lieu')}.zip`);
  return countAttachments(groups);
};
