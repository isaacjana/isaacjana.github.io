// js/modules/actions.js
import { showToast } from './utils.js';

// Re-implement the global window actions using modules where appropriate
// This file will be loaded as an ES module, so we need to explicitly attach to window for HTML event handlers

export function attachGlobalActions() {
    window.openEditClientModal = async (uid) => {
        try {
            const user = await dbAPI.getUserProfile(uid);
            if (!user) { showToast("User not found", "error"); return; }

            const html = `
             <div class="modal-backdrop" id="modal-bg">
                <div class="modal slide-in">
                    <div class="modal-header">
                        <h3 class="modal-title">Edit Client & Store</h3>
                        <button onclick="$('#modal-bg').remove()" class="modal-close"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                    <form id="edit-client-form">
                        <div class="modal-body space-y-4">
                             <div>
                                <label class="form-label">Client Name</label>
                                <input type="text" class="form-input" name="name" value="${user.name || ''}" required>
                             </div>
                             <div>
                                <label class="form-label">Email (Read-only)</label>
                                <input type="email" class="form-input bg-gray-100 cursor-not-allowed" value="${user.email}" readonly>
                             </div>
                             
                             <div class="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                                 <h4 class="font-bold text-blue-900 text-sm uppercase">Store Assignment</h4>
                                 <div>
                                    <label class="form-label">Store ID</label>
                                    <div class="flex gap-2">
                                        <input type="text" class="form-input font-mono" name="storeId" value="${user.storeId || ''}" placeholder="store_xyz" id="input-store-id" required>
                                        <button type="button" onclick="generateStoreId()" class="btn btn-secondary text-xs whitespace-nowrap">Generate New</button>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">Assign multiple users to the same Store ID to share access.</p>
                                 </div>
                                 <div>
                                    <label class="form-label">Store Name</label>
                                    <input type="text" class="form-input" name="storeName" value="${user.storeName || ''}" required>
                                 </div>
                                 <div>
                                    <label class="form-label">Delivery Address</label>
                                    <textarea class="form-input h-24" name="address" required>${user.address || ''}</textarea>
                                 </div>
                             </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" onclick="$('#modal-bg').remove()" class="btn btn-ghost">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
             </div>
            `;
            $('#modal-container').html(html);

            $('#edit-client-form').submit(async (e) => {
                e.preventDefault();
                const data = {
                    name: $('input[name="name"]').val(),
                    storeId: $('input[name="storeId"]').val().trim(),
                    storeName: $('input[name="storeName"]').val().trim(),
                    address: $('textarea[name="address"]').val().trim()
                };

                await dbAPI.updateUser(uid, data);
                $('#modal-bg').remove();
                showToast('Client details updated', 'success');
            });

            window.generateStoreId = () => {
                const id = 'store_' + Math.random().toString(36).substr(2, 9);
                $('#input-store-id').val(id);
            };

        } catch (e) {
            console.error(e);
            showToast("Error loading client", "error");
        }
    };

    // ... attach other global actions if we were fully refactoring
    // For this task, we mainly need the new edit modal attached
}
