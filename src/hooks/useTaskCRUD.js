// useTaskCRUD — shared hook cho tạo/sửa task + upload file
// Giảm code lặp giữa TodayPage và AllTasksPage
import { useCallback } from 'react';
import { createTask, updateTask } from '../firebase/firestore';
import { uploadFile } from '../firebase/storage';

export const useTaskCRUD = (currentUser) => {
    // Tạo task mới kèm upload file
    const handleCreateTask = useCallback(async (data) => {
        if (!currentUser?.uid) return;
        const { pendingFiles, existingAttachments, ...taskData } = data;
        const docRef = await createTask({ ...taskData, attachments: existingAttachments || [] });

        if (pendingFiles?.length > 0) {
            const uploaded = [];
            for (const file of pendingFiles) {
                const result = await uploadFile(file, docRef.id, currentUser.uid);
                uploaded.push(result);
            }
            await updateTask(docRef.id, { attachments: [...(existingAttachments || []), ...uploaded] });
        }

        return docRef;
    }, [currentUser]);

    // Sửa task kèm upload file mới
    const handleEditTask = useCallback(async (taskId, data) => {
        if (!currentUser?.uid) return;
        const { pendingFiles, existingAttachments, ...taskData } = data;
        let allAttachments = existingAttachments || [];

        if (pendingFiles?.length > 0) {
            for (const file of pendingFiles) {
                const result = await uploadFile(file, taskId, currentUser.uid);
                allAttachments = [...allAttachments, result];
            }
        }

        await updateTask(taskId, { ...taskData, attachments: allAttachments }, currentUser.uid, { action: 'edit', field: 'multiple' });
    }, [currentUser]);

    return { handleCreateTask, handleEditTask };
};
