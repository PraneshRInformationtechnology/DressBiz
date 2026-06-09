import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, UserCog, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { userService } from '../api/services';
import { formatDateTime } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import SearchInput from '../components/UI/SearchInput';
import { useAuth } from '../context/AuthContext';

const getId = (obj) => obj?._id || obj?.id;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ search });
      setUsers(res.data.data);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => { setEditUser(null); reset({}); setModalOpen(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setValue('name', u.name);
    setValue('email', u.email);
    setValue('role', u.role);
    setValue('phone', u.phone);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editUser) {
        await userService.update(getId(editUser), data);
        toast.success('User updated!');
      } else {
        await userService.create(data);
        toast.success('User created!');
      }
      setModalOpen(false);
      fetchUsers();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await userService.delete(deleteDialog.id);
      toast.success('User deleted!');
      setDeleteDialog({ open: false, id: null });
      fetchUsers();
    } catch {}
  };

  const handleToggleStatus = async (id) => {
    try {
      await userService.toggleStatus(id);
      toast.success('Status updated!');
      fetchUsers();
    } catch {}
  };

  const currentUserId = getId(currentUser);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage staff accounts and roles</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <SearchInput value={search} onChange={v => setSearch(v)} placeholder="Search users..." className="max-w-sm" />

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Last Login</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                    <UserCog className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No users found</p>
                  </td></tr>
                ) : users.map(u => (
                  <tr key={getId(u)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">{u.email}</td>
                    <td className="table-cell">
                      <span className={u.role === 'admin' ? 'badge-blue' : 'badge-yellow'}>{u.role}</span>
                    </td>
                    <td className="table-cell">{u.phone || '—'}</td>
                    <td className="table-cell text-xs">{u.last_login ? formatDateTime(u.last_login) : 'Never'}</td>
                    <td className="table-cell">
                      <span className={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <Edit className="w-4 h-4" />
                        </button>
                        {getId(u) !== currentUserId && (
                          <>
                            <button onClick={() => handleToggleStatus(getId(u))} className={`p-1.5 rounded-lg ${u.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>
                              {u.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setDeleteDialog({ open: true, id: getId(u) })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" {...register('email', { required: 'Required' })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          {!editUser && (
            <div>
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div>
            <label className="form-label">Role *</label>
            <select className="form-input" {...register('role', { required: 'Required' })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" {...register('phone')} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user?"
      />
    </div>
  );
}
